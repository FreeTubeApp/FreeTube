import {
  MediaHeader,
  SabrError,
  SabrRedirect,
  StreamProtectionStatus,
  UMPPartId,
  VideoPlaybackAbrRequest
} from 'googlevideo/protos'
import { CompositeBuffer, UmpReader } from 'googlevideo/ump'
import { base64ToU8, concatenateChunks, EnabledTrackTypes } from 'googlevideo/utils'
import shaka from 'shaka-player'

import { deepCopy } from '../utils'

const AbortableOperation = shaka.util.AbortableOperation
const ShakaError = shaka.util.Error

/**
 * @param {string} str
 */
function formatIdFromString(str) {
  const videoFormatIdParts = str.split('-')

  return {
    itag: parseInt(videoFormatIdParts[0]),
    lastModified: parseInt(videoFormatIdParts[1]),
    xtags: videoFormatIdParts[2]
  }
}

/**
 * @param {import('googlevideo/protos').FormatId} formatId
 * @param {shaka.extern.BufferedRange} buffered
 * @param {shaka.media.SegmentIndex} segmentIndex
 */
function createBufferedRange(formatId, buffered, segmentIndex) {
  return {
    formatId,
    startTimeMs: Math.trunc(buffered.start * 1000),
    durationMs: Math.trunc((buffered.end - buffered.start) * 1000),
    startSegmentIndex: segmentIndex.find(buffered.start),
    endSegmentIndex: segmentIndex.find(buffered.end) ?? segmentIndex.find(buffered.end - 0.001)
  }
}

/**
 * @param {shaka.Player} player
 * @param {shaka.extern.Manifest} manifest
 * @param {boolean} audioFormatsActive
 * @param {import('googlevideo/protos').BufferedRange[]} bufferedRanges
 * @param {shaka.extern.Track} activeVariant
 */
function fillBufferedRanges(player, manifest, audioFormatsActive, bufferedRanges, activeVariant) {
  const bufferedInfo = player.getBufferedInfo()

  if (bufferedInfo.audio.length > 0 || bufferedInfo.video.length > 0) {
    let activeManifestVariant
    if (audioFormatsActive) {
      activeManifestVariant = manifest.variants.find((variant) => {
        return variant.audio.originalId === activeVariant.originalAudioId
      })
    } else {
      activeManifestVariant = manifest.variants.find((variant) => {
        return variant.audio.originalId === activeVariant.originalAudioId &&
          variant.video.originalId === activeVariant.originalVideoId
      })
    }

    const audioFormatId = formatIdFromString(activeVariant.originalAudioId)
    const audioSegmentIndex = activeManifestVariant.audio.segmentIndex

    for (const buffered of bufferedInfo.audio) {
      bufferedRanges.push(createBufferedRange(audioFormatId, buffered, audioSegmentIndex))
    }

    // Lazily initalise these variables as video data won't exist for audio-only playback
    let videoFormatId
    let videoSegmentIndex

    for (const buffered of bufferedInfo.video) {
      if (!videoFormatId) {
        videoFormatId = formatIdFromString(activeVariant.originalVideoId)
      }

      if (!videoSegmentIndex) {
        videoSegmentIndex = activeManifestVariant.video.segmentIndex
      }

      bufferedRanges.push(createBufferedRange(videoFormatId, buffered, videoSegmentIndex))
    }
  }
}

/**
 * @param {string} uri
 * @param {shaka.extern.Request} request
 * @param {Uint8Array} data
 * @returns {shaka.util.AbortableOperation<shaka.extern.Response>}
 */
function createCacheResponse(uri, request, data) {
  return AbortableOperation.completed({
    data,
    fromCache: true,
    headers: {},
    originalRequest: request,
    originalUri: uri,
    uri
  })
}

/**
 * @param {shaka.util.Error.Code} code
 * @param {...any} args
 */
function createRecoverableNetworkError(code, ...args) {
  return new ShakaError(ShakaError.Severity.RECOVERABLE, ShakaError.Category.NETWORK, code, ...args)
}

/**
 * @param {string} sabrUrl
 * @param {(newUrl: string) => void} updateSabrUrl
 * @param {Map<string, Uint8Array>} initDataCache
 * @param {string} uri
 * @param {string} formatIdString
 * @param {boolean} isInit
 * @param {number} sequenceNumber
 * @param {shaka.extern.Request} request
 * @param {shaka.net.NetworkingEngine.RequestType} requestType
 * @param {RequestInit} init
 * @param {{ cancelled: boolean, timedOut: boolean, finished: boolean }} abortStatus
 * @param {AbortController} abortController
 * @param {(headers: Record<string, string>) => void} headersReceived
 */
async function doRequest(
  sabrUrl,
  updateSabrUrl,
  initDataCache,
  uri,
  formatIdString,
  isInit,
  sequenceNumber,
  request,
  requestType,
  init,
  abortStatus,
  abortController,
  headersReceived
) {
  let response
  /** @type {CompositeBuffer | null} */
  let compositeBuffer = null
  /** @type {Uint8Array[]} */
  const responseDataChunks = []
  let segmentComplete = false

  let invalidPoToken = false
  let error
  /** @type {string | undefined} */
  let redirectUrl

  try {
    response = await fetch(sabrUrl, init)

    headersReceived({})

    const { itag, lastModified, xtags } = formatIdFromString(formatIdString)
    let mediaHeaderId

    const reader = response.body.getReader()
    let readObj = await reader.read()

    while (!readObj.done && !abortStatus.finished) {
      if (compositeBuffer) {
        compositeBuffer.append(readObj.value)
      } else {
        compositeBuffer = new CompositeBuffer([readObj.value])
      }

      const remainingData = new UmpReader(compositeBuffer).read((part) => {
        switch (part.type) {
          case UMPPartId.STREAM_PROTECTION_STATUS: {
            const streamProtectionStatus = StreamProtectionStatus.decode(part.data.chunks[0])
            if (streamProtectionStatus.status === 3) {
              invalidPoToken = true
            }
            break
          }
          case UMPPartId.SABR_ERROR: {
            const sabrError = SabrError.decode(part.data.chunks[0])
            error = `SABR Error: type: ${sabrError.type}, code: ${sabrError.code}`
            break
          }
          case UMPPartId.SABR_REDIRECT: {
            const sabrRedirect = SabrRedirect.decode(part.data.chunks[0])
            redirectUrl = sabrRedirect.url
            updateSabrUrl(redirectUrl)
            break
          }
          case UMPPartId.MEDIA_HEADER: {
            if (mediaHeaderId === undefined) {
              const mediaHeader = MediaHeader.decode(part.data.chunks[0])

              if (
                mediaHeader.formatId.itag === itag &&
                mediaHeader.formatId.lastModified === lastModified &&
                mediaHeader.formatId.xtags === xtags
              ) {
                if (isInit && mediaHeader.isInitSeg) {
                  mediaHeaderId = mediaHeader.headerId
                } else if (!isInit && mediaHeader.sequenceNumber === sequenceNumber) {
                  mediaHeaderId = mediaHeader.headerId
                }
              }
            }

            break
          }
          case UMPPartId.MEDIA: {
            if (mediaHeaderId === part.data.getUint8(0)) {
              responseDataChunks.push(...part.data.split(1).remainingBuffer.chunks)
            }
            break
          }
          case UMPPartId.MEDIA_END: {
            if (mediaHeaderId === part.data.getUint8(0)) {
              segmentComplete = true
              abortStatus.finished = true
              abortController.abort()
            }
            break
          }
        }
      })

      if (!abortStatus.finished) {
        if (remainingData) {
          compositeBuffer = remainingData.data
        } else {
          compositeBuffer = null
        }

        readObj = await reader.read()
      }
    }
  } catch (error) {
    if (abortStatus.cancelled) {
      throw createRecoverableNetworkError(ShakaError.Code.OPERATION_ABORTED, uri, requestType)
    } else if (abortStatus.timedOut) {
      throw createRecoverableNetworkError(ShakaError.Code.TIMEOUT, uri, requestType)
    } else if (!abortStatus.finished) {
      throw createRecoverableNetworkError(ShakaError.Code.HTTP_ERROR, uri, error, requestType)
    }
  }

  if (abortStatus.cancelled) {
    throw createRecoverableNetworkError(ShakaError.Code.OPERATION_ABORTED, uri, requestType)
  } else if (abortStatus.timedOut) {
    throw createRecoverableNetworkError(ShakaError.Code.TIMEOUT, uri, requestType)
  }

  if (responseDataChunks.length > 0 && segmentComplete) {
    const data = /** @__NOINLINE__ */ concatenateChunks(responseDataChunks)

    if (isInit) {
      initDataCache.set(formatIdString, data)
    }

    /** @type {shaka.extern.Response} */
    return {
      uri,
      originalUri: uri,
      data,
      status: response.status,
      headers: {},
      fromCache: false,
      originalRequest: request
    }
  } else if (redirectUrl) {
    abortStatus.finished = false
    return doRequest(
      redirectUrl,
      updateSabrUrl,
      initDataCache,
      uri,
      formatIdString,
      isInit,
      sequenceNumber,
      request,
      requestType,
      init,
      abortStatus,
      abortController,
      () => { }
    )
  } else if (invalidPoToken) {
    throw new ShakaError(
      ShakaError.Severity.CRITICAL,
      ShakaError.Category.NETWORK,
      ShakaError.Code.HTTP_ERROR,
      uri,
      new Error('Invalid PO token'),
      requestType
    )
  } else if (error) {
    throw createRecoverableNetworkError(
      ShakaError.Code.HTTP_ERROR,
      uri,
      new Error(error),
      requestType
    )
  } else if (responseDataChunks.length > 0 && !segmentComplete) {
    throw createRecoverableNetworkError(
      ShakaError.Code.HTTP_ERROR,
      uri,
      new Error('Incomplete segment, missing MEDIA_END part'),
      requestType
    )
  } else if (response.status === 200) {
    throw createRecoverableNetworkError(
      ShakaError.Code.HTTP_ERROR,
      uri,
      new Error('Empty response, this should not happen'),
      requestType
    )
  } else {
    const severity = response.status === 401 || response.status === 403
      ? ShakaError.Severity.CRITICAL
      : ShakaError.Severity.RECOVERABLE

    throw new ShakaError(
      severity,
      ShakaError.Category.NETWORK,
      ShakaError.Code.BAD_HTTP_STATUS,
      uri,
      response.status,
      '',
      {},
      requestType,
      uri
    )
  }
}

/**
 * @param {import('../../views/Watch/Watch').SabrData} sabrData
 * @param {() => shaka.Player} getPlayer
 * @param {() => shaka.extern.Manifest} getManifest
 * @param {import('vue').ComputedRef<number>} playerWidth
 * @param {import('vue').ComputedRef<number>} playerHeight
 */
export function setupSabrScheme(sabrData, getPlayer, getManifest, playerWidth, playerHeight) {
  /**
   * Caches the init data until the video ends
   * that way changing qualities and between audio and DASH
   * doesn't have to fetch the init data and segment index again
   * @type {Map<string, Uint8Array>}
   */
  const initDataCache = new Map()

  const poToken = base64ToU8(sabrData.poToken)
  const videoPlaybackUstreamerConfig = base64ToU8(sabrData.ustreamerConfig)
  const clientInfo = deepCopy(sabrData.clientInfo)

  let sabrUrl = sabrData.url

  const updateSabrUrl = (newUrl) => {
    sabrUrl = newUrl
  }

  shaka.net.NetworkingEngine.registerScheme('sabr', (uri, request, requestType, progressUpdated, headersReceived, config) => {
    // lazily fetch it as the variable is only set after setupSabrScheme is called
    // but it will definitely exist when we receive a request here.
    const player = getPlayer()
    const isAudioOnly = player.isAudioOnly()

    const url = new URL(request.uris[0])

    const isInit = url.searchParams.has('init')
    const formatIdString = url.searchParams.get('formatId')

    if (isInit && initDataCache.has(formatIdString)) {
      return /** @__NOINLINE__ */ createCacheResponse(uri, request, initDataCache.get(formatIdString))
    }

    const variantTracks = player.getVariantTracks()
    const activeVariant = variantTracks.find(track => track.active)

    const streamIsAudio = url.hostname === 'audio'
    const streamIsVideo = url.hostname === 'video'

    let audioFormatId
    let videoFormatId

    if (streamIsAudio) {
      audioFormatId = formatIdFromString(formatIdString)

      if (isAudioOnly) {
        // We need to specify a video format even for audio only otherwise we get an error response
        videoFormatId = formatIdFromString(url.searchParams.get('videoFormatId'))
      } else {
        videoFormatId = formatIdFromString((activeVariant ?? variantTracks[0]).originalVideoId)
      }
    } else if (streamIsVideo) {
      videoFormatId = formatIdFromString(formatIdString)

      // for the first fetching of the initial data there won't be an active variant
      // (shaka-player only sets it to active after it has fetched the init/segment data)
      if (activeVariant) {
        audioFormatId = formatIdFromString(activeVariant.originalAudioId)
      } else {
        const candidates = variantTracks.filter((track) => track.audioRoles.includes('main'))

        const probableAudioFormat = candidates.reduce((previous, current) => {
          return current.audioBandwidth >= previous.audioBandwidth ? current : previous
        }, candidates[0])

        audioFormatId = formatIdFromString(probableAudioFormat.originalAudioId)
      }
    }

    /** @type {import('googlevideo/protos').BufferedRange[]} */
    const bufferedRanges = []

    if (!isInit && activeVariant) {
      /** @__NOINLINE__ */ fillBufferedRanges(player, getManifest(), isAudioOnly, bufferedRanges, activeVariant)
    }

    let playerTimeMs = 0

    if (url.searchParams.has('startTimeMs')) {
      playerTimeMs = parseInt(url.searchParams.get('startTimeMs'))
    }

    const drcEnabled = url.searchParams.has('drc') || !!(activeVariant && activeVariant.audioRoles.includes('drc'))

    const resolution = streamIsVideo ? parseInt(url.searchParams.get('resolution')) : undefined

    /** @type {import('googlevideo/protos').VideoPlaybackAbrRequest} */
    const requestData = {
      clientAbrState: {
        bandwidthEstimate: Math.round(player.getStats().estimatedBandwidth),
        timeSinceLastManualFormatSelectionMs: streamIsVideo ? 0 : undefined,
        stickyResolution: resolution,
        lastManualSelectedResolution: resolution,
        playbackRate: player.getPlaybackRate(),
        enabledTrackTypesBitfield: streamIsAudio ? EnabledTrackTypes.AUDIO_ONLY : EnabledTrackTypes.VIDEO_AND_AUDIO,
        drcEnabled,
        playerTimeMs,
        clientViewportWidth: playerWidth.value,
        clientViewportHeight: playerHeight.value,
        clientViewportIsFlexible: false
      },
      preferredAudioFormatIds: [audioFormatId],
      preferredVideoFormatIds: [videoFormatId],
      preferredSubtitleFormatIds: [],
      selectedFormatIds: isInit ? [] : [audioFormatId, videoFormatId],
      bufferedRanges,
      streamerContext: {
        poToken: poToken,
        clientInfo: clientInfo,
        sabrContexts: [],
        unsentSabrContexts: []
      },
      field1000: [],
      videoPlaybackUstreamerConfig,
    }

    let body

    try {
      body = VideoPlaybackAbrRequest.encode(requestData).finish()
    } catch (error) {
      console.error('Invalid VideoPlaybackAbrRequest data', requestData)
      throw error
    }

    const controller = new AbortController()

    /** @type {RequestInit} */
    const init = {
      body,
      method: 'POST',
      signal: controller.signal
    }

    const abortStatus = {
      cancelled: false,
      timedOut: false,
      finished: false
    }

    const sequenceNumber = parseInt(url.searchParams.get('sq'))

    const pendingRequest = doRequest(
      sabrUrl,
      updateSabrUrl,
      initDataCache,
      uri,
      formatIdString,
      isInit,
      sequenceNumber,
      request,
      requestType,
      init,
      abortStatus,
      controller,
      headersReceived
    )

    const op = new AbortableOperation(pendingRequest, () => {
      abortStatus.cancelled = true
      controller.abort()
      return Promise.resolve()
    })

    const timeoutMs = request.retryParameters.timeout
    if (timeoutMs) {
      const timeout = setTimeout(() => {
        abortStatus.timedOut = true
        controller.abort()
      }, timeoutMs)

      op.finally(() => {
        clearTimeout(timeout)
      })
    }

    return op
  })

  const cleanup = () => {
    shaka.net.NetworkingEngine.unregisterScheme('sabr')
    initDataCache.clear()
  }

  return cleanup
}
