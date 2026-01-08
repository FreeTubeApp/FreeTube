import { ClientType, Innertube, Misc, Mixins, Parser, Platform, UniversalCache, Utils, YT, YTNodes } from 'youtubei.js'
import Autolinker from 'autolinker'
import { SEARCH_CHAR_LIMIT } from '../../../constants'

import { PlayerCache } from './PlayerCache'
import {
  CHANNEL_HANDLE_REGEX,
  calculatePublishedDate,
  escapeHTML,
  extractNumberFromString,
  getChannelPlaylistId,
  getRelativeTimeFromDate,
} from '../utils'

const TRACKING_PARAM_NAMES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]

if (process.env.SUPPORTS_LOCAL_API) {
  Platform.shim.eval = (data, env) => {
    return new Promise((resolve, reject) => {
      const properties = []

      if (env.n) {
        properties.push(`n: exportedVars.nFunction("${env.n}")`)
      }

      if (env.sig) {
        properties.push(`sig: exportedVars.sigFunction("${env.sig}")`)
      }

      // Triggers permission errors if we don't remove it (added by YouTube.js), as sessionStorage isn't accessible in sandboxed cross-origin iframes
      const modifiedOutput = data.output.replace('const window = Object.assign({}, globalThis);', '')

      const code = `${modifiedOutput}\nreturn {${properties.join(', ')}}`

      // Generate a unique ID, as there may be multiple eval calls going on at the same time (e.g. DASH manifest generation)
      const messageId = process.env.IS_ELECTRON || crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 10000)}`

      if (process.env.IS_ELECTRON) {
        const iframe = document.getElementById('sigFrame')

        /** @param {MessageEvent} event */
        const listener = (event) => {
          if (event.source === iframe.contentWindow && typeof event.data === 'string') {
            const data = JSON.parse(event.data)

            if (data.id === messageId) {
              window.removeEventListener('message', listener)

              if (data.error) {
                reject(data.error)
              } else {
                resolve(data.result)
              }
            }
          }
        }

        window.addEventListener('message', listener)
        iframe.contentWindow.postMessage(JSON.stringify({ id: messageId, code }), '*')
      } else {
        reject(new Error('Please setup the eval function for the n/sig deciphering'))
      }
    })
  }
}

/**
 * Creates a lightweight Innertube instance, which is faster to create or
 * an instance that can decode the streaming URLs, which is slower to create
 * the lightweight one only needs a single web request to create the new session
 * the full one needs 3 (or 2 if the player is cached) web requests to create:
 * 1. the request for the session
 * 2. fetch a page that contains a link to the player
 * 3. if the player isn't cached, it is downloaded and transformed
 * @param {object} options
 * @param {boolean} options.withPlayer set to true to get an Innertube instance that can decode the streaming URLs
 * @param {string|undefined} options.location the geolocation to pass to YouTube get different content
 * @param {boolean} options.safetyMode whether to hide mature content
 * @param {import('youtubei.js').ClientType} options.clientType use an alterate client
 * @param {boolean} options.generateSessionLocally generate the session locally or let YouTube generate it (local is faster, remote is more accurate)
 * @returns the Innertube instance
 */
async function createInnertube({ withPlayer = false, location = undefined, safetyMode = false, clientType = undefined, generateSessionLocally = true } = {}) {
  let cache
  if (withPlayer) {
    if (process.env.IS_ELECTRON) {
      cache = new PlayerCache()
    } else {
      cache = new UniversalCache(false)
    }
  }

  return await Innertube.create({
    // This setting is enabled by default and results in YouTube.js reusing the same session across different Innertube instances.
    // That behavior is highly undesirable for FreeTube, as we want to create a new session every time to limit tracking.
    enable_session_cache: false,
    retrieve_innertube_config: !generateSessionLocally,
    user_agent: navigator.userAgent,

    retrieve_player: !!withPlayer,
    location: location,
    enable_safety_mode: !!safetyMode,
    client_type: clientType,

    // use browser fetch
    fetch: !withPlayer
      ? (input, init) => fetch(input, init)
      : async (input, init) => {
        if (input.url?.startsWith('https://www.youtube.com/youtubei/v1/player') && init?.headers?.get('X-Youtube-Client-Name') === '2') {
          const response = await fetch(input, init)

          const responseText = await response.text()

          const json = JSON.parse(responseText)

          if (Array.isArray(json.adSlots)) {
            let waitSeconds = 0

            for (const adSlot of json.adSlots) {
              if (adSlot.adSlotRenderer?.adSlotMetadata?.triggerEvent === 'SLOT_TRIGGER_EVENT_BEFORE_CONTENT') {
                const playerVars = adSlot.adSlotRenderer.fulfillmentContent?.fulfilledLayout?.playerBytesAdLayoutRenderer
                  ?.renderingContent?.instreamVideoAdRenderer?.playerVars

                if (playerVars) {
                  const match = playerVars.match(/length_seconds=([\d.]+)/)

                  if (match) {
                    waitSeconds += parseFloat(match[1])
                  }
                }
              }
            }

            if (waitSeconds > 0) {
              await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000))
            }
          }

          // Need to return a new response object, as you can only read the response body once.
          return new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          })
        }

        return fetch(input, init)
      },
    cache,
    generate_session_locally: !!generateSessionLocally
  })
}

/** @type {Innertube | null} */
let searchSuggestionsSession = null

export async function getLocalSearchSuggestions(query) {
  // The search suggestions endpoint does not like search queries larger than SEARCH_CHAR_LIMIT
  // so return an empty array instead
  if (query.length > SEARCH_CHAR_LIMIT) {
    return []
  }

  // reuse innertube instance to keep the search suggestions snappy
  if (searchSuggestionsSession === null) {
    searchSuggestionsSession = await createInnertube()
  }

  return await searchSuggestionsSession.getSearchSuggestions(query)
}

export function clearLocalSearchSuggestionsSession() {
  searchSuggestionsSession = null
}

export async function getLocalPlaylist(id) {
  const innertube = await createInnertube()
  return await innertube.getPlaylist(id)
}

/**
 * @typedef {object} SerializedContinuation
 * @property {import('youtubei.js').Context} context
 * @property {string} path
 * @property {any} payload
 */

/**
 * @param {import('youtubei.js').YTNodes.ContinuationItem} continuationItem
 * @param {import('youtubei.js').Actions} actions
 */
function serializeContinuationItem(continuationItem, actions) {
  let path, payload

  // Based on YouTube.js' NavigationEndpoint#call()
  if (continuationItem.endpoint.command.is(YTNodes.CommandExecutorCommand)) {
    /** @type {import('youtubei.js').Helpers.YTNode & import('youtubei.js').APIResponseTypes.IEndpoint} */
    const command = continuationItem.endpoint.command.commands.at(-1)

    path = command.getApiPath()
    payload = command.buildRequest()
  } else {
    path = continuationItem.endpoint.metadata.api_url
    payload = continuationItem.endpoint.payload
  }

  /** @type {SerializedContinuation} */
  const data = {
    path,
    payload: payload,
    context: actions.session.context
  }

  return JSON.stringify(data)
}

/**
 * @param {import('youtubei.js').Mixins.Feed} feed
 */
function extractFeedContinuationItem(feed) {
  let continuationItem

  if (feed.page.header_memo) {
    const headerContinuations = feed.page.header_memo.getType(YTNodes.ContinuationItem)
    continuationItem = feed.memo.getType(YTNodes.ContinuationItem).find(
      (continuation) => !headerContinuations.includes(continuation)
    )
  } else {
    continuationItem = feed.memo.getType(YTNodes.ContinuationItem)[0]
  }

  if (!continuationItem) {
    throw new Utils.InnertubeError('There are no continuations.')
  }

  return continuationItem
}

/**
 * Based on YouTube.js' YT.Playlist.getContinuationData method
 * @param {import('youtubei.js').YT.Playlist} playlist
 */
export function extractLocalCacheablePlaylistContinuation(playlist) {
  const sectionList = playlist.memo.getType(YTNodes.SectionList)[0]

  let continuationItem

  // No section list means there can't be additional continuation nodes here,
  // so no need to check.
  if (!sectionList) {
    continuationItem = extractFeedContinuationItem(playlist)
  } else {
    continuationItem = playlist.memo.getType(YTNodes.ContinuationItem)
      .find((node) => !sectionList.contents.includes(node))
  }

  if (!continuationItem) {
    throw new Utils.InnertubeError('There are no continuations.')
  }

  return serializeContinuationItem(continuationItem, playlist.actions)
}

/**
 * Based on YouTube.js' YT.Search.getContinuationData method
 * @param {import('youtubei.js').YT.Search} search
 * @returns {SerializedContinuation}
 */
export function extractLocalCacheableSearchContinuation(search) {
  const continuationItem = extractFeedContinuationItem(search)

  return serializeContinuationItem(continuationItem, search.actions)
}

/**
 * @overload
 * @param {'playlist'} type
 * @param {string} continuation
 * @returns {Promise<import('youtubei.js').YT.Playlist>}
 */

/**
 * @overload
 * @param {'search'} type
 * @param {string} continuation
 * @returns {Promise<import('youtubei.js').YT.Search>}
 */

/**
 * @param {'playlist' | 'search'} type
 * @param {string} continuation
 */
export async function getLocalCachedFeedContinuation(type, continuation) {
  /** @type {SerializedContinuation} */
  const data = JSON.parse(continuation)

  const innertube = await createInnertube()
  innertube.session.context = data.context

  const page = await innertube.actions.execute(data.path, { ...data.payload, parse: true })

  if (!page) {
    throw new Utils.InnertubeError('Could not get continuation data')
  }

  if (type === 'playlist') {
    return new YT.Playlist(innertube.actions, page, true)
  } else {
    return new YT.Search(innertube.actions, page, true)
  }
}

/**
 * @param {import('youtubei.js').YT.Playlist} playlist
 * @returns {Promise<import('youtubei.js').YT.Playlist|null>} null when no valid playlist can be found (e.g. `empty continuation response`)
 */
export async function getLocalPlaylistContinuation(playlist) {
  try {
    return await playlist.getContinuation()
  } catch (error) {
    // Youtube can provide useless continuation data
    if (!error.message.includes('Got empty continuation response.')) {
      // Re-throw unhandled error
      throw error
    }

    return null
  }
}

/**
 * Callback for adding two numbers.
 *
 * @callback untilEndOfLocalPlayListCallback
 * @param {import('youtubei.js').YT.Playlist} playlist
 */

/**
 * @param {import('youtubei.js').YT.Playlist} playlist
 * @param {untilEndOfLocalPlayListCallback} callback
 * @param {object} options
 * @param {boolean} options.runCallbackOnceFirst
 */
export async function untilEndOfLocalPlayList(playlist, callback, options = { runCallbackOnceFirst: true }) {
  if (options.runCallbackOnceFirst) { callback(playlist) }

  while (playlist != null && playlist.has_continuation) {
    playlist = await getLocalPlaylistContinuation(playlist)

    if (playlist != null) { callback(playlist) }
  }
}

/**
 * @param {string} location
 * @param {'gaming' | 'sports' | 'podcasts'} tab
 */
export async function getLocalTrending(location, tab) {
  const innertube = await createInnertube({ location })

  let args

  switch (tab) {
    case 'gaming':
      // https://www.youtube.com/gaming/trending
      args = {
        browseId: 'UCOpNcN46UbXVtpKMrmU4Abg',
        params: 'Egh0cmVuZGluZ7gBAJIDAPIGBAoCMgA'
      }
      break
    case 'sports':
      // https://www.youtube.com/channel/UCEgdi0XIXXZ-qJOFPf4JSKw/sportstab?ss=CMMG
      args = {
        browseId: 'UCEgdi0XIXXZ-qJOFPf4JSKw',
        params: 'EglzcG9ydHN0YWK4AQCSAwDyBgQKAjIA'
      }
      break
    case 'podcasts':
      // https://www.youtube.com/podcasts/popularepisodes
      args = {
        browseId: 'FEpodcasts_destination',
        params: 'qgcCCAM%3D'
      }
      break
    default:
      throw new Error('Unknown trending tab')
  }

  const response = await innertube.actions.execute('/browse', args)
  const feed = new Mixins.Feed(innertube.actions, response)

  return feed.videos.map(video => parseLocalListVideo(video))
}

/**
 * @param {string} query
 * @param {object} filters
 * @param {boolean} safetyMode
 */
export async function getLocalSearchResults(query, filters, safetyMode) {
  const innertube = await createInnertube({ safetyMode })
  const response = await innertube.search(query, convertSearchFilters(filters))

  return handleSearchResponse(response)
}

/**
 * @param {YT.Search | SerializedContinuation} continuationData
 */
export async function getLocalSearchContinuation(continuationData) {
  let response

  if (continuationData instanceof YT.Search) {
    response = await continuationData.getContinuation()
  } else {
    response = await getLocalCachedFeedContinuation('search', continuationData)
  }

  return handleSearchResponse(response)
}

/**
 * @param {string} id
 */
export async function getLocalVideoInfo(id) {
  const webInnertube = await createInnertube({ withPlayer: true, generateSessionLocally: false })

  // based on the videoId
  let contentPoToken

  if (process.env.IS_ELECTRON) {
    try {
      contentPoToken = await window.ftElectron.generatePoToken(
        id,
        JSON.stringify(webInnertube.session.context)
      )

      webInnertube.session.player.po_token = contentPoToken
    } catch (error) {
      console.error('Local API, poToken generation failed', error)
      throw error
    }
  }

  let clientName = webInnertube.session.context.client.clientName

  const info = await webInnertube.getInfo(id, { po_token: contentPoToken })

  // #region temporary workaround for SABR-only responses

  // MWEB doesn't have an audio track selector so it picks the audio track on the server based on the request language.

  const originalAudioTrackFormat = info.streaming_data?.adaptive_formats.find(format => {
    return format.has_audio && format.is_original && format.language
  })

  if (originalAudioTrackFormat) {
    webInnertube.session.context.client.hl = originalAudioTrackFormat.language
  }

  const mwebInfo = await webInnertube.getBasicInfo(id, { client: 'MWEB', po_token: contentPoToken })

  if (mwebInfo.playability_status.status === 'OK' && mwebInfo.streaming_data) {
    info.playability_status = mwebInfo.playability_status
    info.streaming_data = mwebInfo.streaming_data

    clientName = 'MWEB'
  }

  // #endregion temporary workaround for SABR-only responses

  let hasTrailer = info.has_trailer
  let trailerIsAgeRestricted = info.getTrailerInfo() === null

  if (
    ((info.playability_status.status === 'UNPLAYABLE' || info.playability_status.status === 'LOGIN_REQUIRED') &&
      info.playability_status.reason === 'Sign in to confirm your age') ||
    (hasTrailer && trailerIsAgeRestricted)
  ) {
    const webEmbeddedInnertube = await createInnertube({ clientType: ClientType.WEB_EMBEDDED })
    webEmbeddedInnertube.session.context.client.visitorData = webInnertube.session.context.client.visitorData

    const videoId = hasTrailer && trailerIsAgeRestricted ? info.playability_status.error_screen.video_id : id

    // getBasicInfo needs the signature timestamp (sts) from inside the player
    webEmbeddedInnertube.session.player = webInnertube.session.player

    const bypassedInfo = await webEmbeddedInnertube.getBasicInfo(videoId, { client: 'WEB_EMBEDDED', po_token: contentPoToken })

    if (bypassedInfo.playability_status.status === 'OK' && bypassedInfo.streaming_data) {
      info.playability_status = bypassedInfo.playability_status
      info.streaming_data = bypassedInfo.streaming_data
      info.basic_info.start_timestamp = bypassedInfo.basic_info.start_timestamp
      info.basic_info.duration = bypassedInfo.basic_info.duration
      info.captions = bypassedInfo.captions
      info.storyboards = bypassedInfo.storyboards

      hasTrailer = false
      trailerIsAgeRestricted = false

      clientName = webEmbeddedInnertube.session.context.client.clientName
    }
  }

  if ((info.playability_status.status === 'UNPLAYABLE' && (!hasTrailer || trailerIsAgeRestricted)) ||
    info.playability_status.status === 'LOGIN_REQUIRED') {
    return info
  }

  if (hasTrailer && info.playability_status.status !== 'OK') {
    const trailerInfo = info.getTrailerInfo()

    // don't override the timestamp of when the video will premiere for upcoming videos
    if (info.playability_status.status !== 'LIVE_STREAM_OFFLINE') {
      info.basic_info.start_timestamp = trailerInfo.basic_info.start_timestamp
    }

    info.playability_status = trailerInfo.playability_status
    info.streaming_data = trailerInfo.streaming_data
    info.basic_info.duration = trailerInfo.basic_info.duration
    info.captions = trailerInfo.captions
    info.storyboards = trailerInfo.storyboards
  }

  if (info.streaming_data) {
    await decipherFormats(info.streaming_data.formats, webInnertube.session.player)

    const firstFormat = info.streaming_data.adaptive_formats[0]

    if (firstFormat.url || firstFormat.signature_cipher || firstFormat.cipher) {
      await decipherFormats(info.streaming_data.adaptive_formats, webInnertube.session.player)
    }

    if (info.streaming_data.dash_manifest_url) {
      let url = info.streaming_data.dash_manifest_url

      if (url.includes('?')) {
        url += `&pot=${encodeURIComponent(contentPoToken)}&mpd_version=7`
      } else {
        url += `${url.endsWith('/') ? '' : '/'}pot/${encodeURIComponent(contentPoToken)}/mpd_version/7`
      }

      info.streaming_data.dash_manifest_url = url
    }
  }

  if (info.captions?.caption_tracks) {
    for (const captionTrack of info.captions.caption_tracks) {
      const url = new URL(captionTrack.base_url)

      url.searchParams.set('potc', '1')
      url.searchParams.set('pot', contentPoToken)
      url.searchParams.set('c', clientName)

      // Remove &xosf=1 as it adds `position:63% line:0%` to the subtitle lines
      // placing them in the top right corner
      url.searchParams.delete('xosf')

      captionTrack.base_url = url.toString()
    }
  }

  return info
}

/**
 * @param {string} id
 */
export async function getLocalComments(id) {
  const innertube = await createInnertube()
  return innertube.getComments(id)
}

// I know `type & type` is typescript syntax and not valid jsdoc but I couldn't get @extends or @augments to work

/**
 * @typedef {object} _LocalFormat
 * @property {string} freeTubeUrl deciphered streaming URL, stored in a custom property so the DASH manifest generation doesn't break
 *
 * @typedef {Misc.Format & _LocalFormat} LocalFormat
 */

/**
 * @param {Misc.Format[]} formats
 * @param {import('youtubei.js').Player} player
 */
async function decipherFormats(formats, player) {
  for (const format of formats) {
    // toDash deciphers the format again, so if we overwrite the original URL,
    // it breaks because the n param would get deciphered twice and then be incorrect
    format.freeTubeUrl = await format.decipher(player)
  }
}

/**
 * @param {string} url
 * @param {boolean} doLogError
 */
export async function getLocalChannelId(url, doLogError = false) {
  try {
    const innertube = await createInnertube()

    // Resolve URL and allow 1 redirect, as YouTube should just do 1
    // We want to avoid an endless loop
    for (let i = 0; i < 2; i++) {
      // resolveURL throws an error if the URL doesn't exist
      const navigationEndpoint = await innertube.resolveURL(url)

      if (navigationEndpoint.metadata.page_type === 'WEB_PAGE_TYPE_CHANNEL') {
        return navigationEndpoint.payload.browseId
      } else if (navigationEndpoint.metadata.page_type === 'WEB_PAGE_TYPE_UNKNOWN' && navigationEndpoint.payload.url?.startsWith('https://www.youtube.com/')) {
        // handle redirects like https://www.youtube.com/@wanderbots, which resolves to https://www.youtube.com/Wanderbots, which we need to resolve again
        url = navigationEndpoint.payload.url
      } else if (navigationEndpoint.payload.browseId === 'FEpost_detail') {
        // convert base64 params to string and get the channelid
        return atob(navigationEndpoint.payload.params).replaceAll(/[^\d\sA-Za-z-]/g, ' ').trim().split(' ').at(-1)
      }
    }
  } catch (e) {
    if (doLogError) {
      console.error(e)
    }
  }

  return null
}

/**
 * Returns the channel or the channel termination reason
 * @param {string} id
 */
export async function getLocalChannel(id) {
  const innertube = await createInnertube()
  let result
  try {
    result = await innertube.getChannel(id)
  } catch (error) {
    if (error instanceof Utils.ChannelError) {
      result = {
        alert: error.message
      }
    } else {
      throw error
    }
  }
  return result
}

/**
 * @param {string} id
 */
export async function getLocalChannelVideos(id) {
  const innertube = await createInnertube()

  try {
    const response = await innertube.actions.execute('/browse', {
      browseId: id,
      params: 'EgZ2aWRlb3PyBgQKAjoA'
      // protobuf for the videos tab (this is the one that YouTube uses,
      // it has some empty fields in the protobuf but it doesn't work if you remove them)
    })

    const videosTab = new YT.Channel(null, response)
    const { id: channelId = id, name, thumbnailUrl } = parseLocalChannelHeader(videosTab, true)

    let videos

    // if the channel doesn't have a videos tab, YouTube returns the home tab instead
    // so we need to check that we got the right tab
    if (videosTab.current_tab?.endpoint.metadata.url?.endsWith('/videos')) {
      videos = parseLocalChannelVideos(videosTab.videos, channelId, name)
    } else if (name.endsWith('- Topic') && !!videosTab.metadata.music_artist_name) {
      try {
        const playlist = await innertube.getPlaylist(getChannelPlaylistId(channelId, 'videos', 'newest'))

        videos = playlist.items.map(parseLocalPlaylistVideo)
      } catch (error) {
        // If the channel doesn't exist, the API call to channel page above would have already failed,
        // so if we get an error that the playlist doesn't exist here, it just means that this artist topic channel
        // doesn't have any videos.
        if (error.message === 'The playlist does not exist.') {
          videos = []
        } else {
          throw error
        }
      }
    } else {
      videos = []
    }

    return {
      name,
      thumbnailUrl,
      videos
    }
  } catch (error) {
    console.error(error)
    if (error instanceof Utils.ChannelError) {
      return null
    } else {
      throw error
    }
  }
}

/**
 * @param {string} id
 */
export async function getLocalChannelLiveStreams(id) {
  const innertube = await createInnertube()

  try {
    const response = await innertube.actions.execute('/browse', {
      browseId: id,
      params: 'EgdzdHJlYW1z8gYECgJ6AA%3D%3D'
      // protobuf for the live tab (this is the one that YouTube uses,
      // it has some empty fields in the protobuf but it doesn't work if you remove them)
    })

    let liveStreamsTab = new YT.Channel(innertube.actions, response)
    const { id: channelId = id, name, thumbnailUrl } = parseLocalChannelHeader(liveStreamsTab, true)

    let videos

    // if the channel doesn't have a live tab, YouTube returns the home tab instead
    // so we need to check that we got the right tab
    if (liveStreamsTab.current_tab?.endpoint.metadata.url?.endsWith('/streams')) {
      // work around YouTube bug where it will return a bunch of responses with only continuations in them
      // e.g. https://www.youtube.com/@TWLIVES/streams

      let tempVideos = liveStreamsTab.videos
      while (tempVideos.length === 0 && liveStreamsTab.has_continuation) {
        liveStreamsTab = await liveStreamsTab.getContinuation()
        tempVideos = liveStreamsTab.videos
      }

      videos = parseLocalChannelVideos(tempVideos, channelId, name)
    } else {
      videos = []
    }

    return {
      name,
      thumbnailUrl,
      videos
    }
  } catch (error) {
    console.error(error)
    if (error instanceof Utils.ChannelError) {
      return null
    } else {
      throw error
    }
  }
}

export async function getLocalChannelCommunity(id) {
  const innertube = await createInnertube()

  try {
    const response = await innertube.actions.execute('/browse', {
      browseId: id,
      params: 'EgVwb3N0c_IGBAoCSgA%3D'
      // protobuf for the community tab (this is the one that YouTube uses,
      // it has some empty fields in the protobuf but it doesn't work if you remove them)
    })

    const communityTab = new YT.Channel(null, response)

    // if the channel doesn't have a community tab, YouTube returns the home tab instead
    // so we need to check that we got the right tab
    if (communityTab.current_tab?.endpoint.metadata.url?.endsWith('/posts')) {
      return parseLocalCommunityPosts(communityTab.posts)
    } else {
      return []
    }
  } catch (error) {
    console.error(error)
    if (error instanceof Utils.ChannelError) {
      return null
    } else {
      throw error
    }
  }
}

/**
 * @param {YT.Channel} channel
 */
export async function getLocalArtistTopicChannelReleases(channel) {
  const rawEngagementPanel = channel.shelves[0]?.menu?.top_level_buttons?.[0]?.endpoint.payload?.engagementPanel

  if (!rawEngagementPanel) {
    return {
      releases: channel.playlists.map(playlist => parseLocalListPlaylist(playlist)),
      continuationData: null
    }
  }

  /** @type {import('youtubei.js').YTNodes.EngagementPanelSectionList} */
  const engagementPanelSectionList = Parser.parseItem(rawEngagementPanel)

  /** @type {import('youtubei.js').YTNodes.ContinuationItem|undefined} */
  const continuationItem = engagementPanelSectionList?.content?.contents?.[0]?.contents?.[0]

  if (!continuationItem) {
    return {
      releases: channel.playlists.map(playlist => parseLocalListPlaylist(playlist)),
      continuationData: null
    }
  }

  return await getLocalArtistTopicChannelReleasesContinuation(channel, continuationItem)
}

/**
 * @param {YT.Channel} channel
 * @param {import('youtubei.js').YTNodes.ContinuationItem} continuationData
 */
export async function getLocalArtistTopicChannelReleasesContinuation(channel, continuationData) {
  const response = await continuationData.endpoint.call(channel.actions, { parse: true })

  const memo = response.on_response_received_endpoints_memo

  const playlists = memo.get('GridPlaylist') ?? memo.get('LockupView') ?? memo.get('Playlist')

  /** @type {import('youtubei.js').YTNodes.ContinuationItem | null} */
  const continuationItem = memo.get('ContinuationItem')?.[0] ?? null

  return {
    releases: playlists ? playlists.map(playlist => parseLocalListPlaylist(playlist)) : [],
    continuationData: continuationItem
  }
}

/**
 * @param {YT.Channel} channel
 * @param {boolean} onlyIdNameThumbnail
 */
export function parseLocalChannelHeader(channel, onlyIdNameThumbnail = false) {
  /** @type {string?} */
  let id
  /** @type {string} */
  let name
  /** @type {string?} */
  let thumbnailUrl
  /** @type {string?} */
  let bannerUrl
  /** @type {string?} */
  let subscriberText
  /** @type {string[]} */
  const tags = []

  switch (channel.header.type) {
    case 'C4TabbedHeader': {
      // example: Linus Tech Tips
      // https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw

      /**
       * @type {import('youtubei.js').YTNodes.C4TabbedHeader}
       */
      const header = channel.header

      id = header.author.id
      name = header.author.name
      thumbnailUrl = header.author.best_thumbnail.url

      if (!onlyIdNameThumbnail) {
        bannerUrl = header.banner?.[0]?.url
        subscriberText = header.subscribers?.text
      }
      break
    }
    case 'CarouselHeader': {
      // examples: Music and YouTube Gaming
      // https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ
      // https://www.youtube.com/channel/UCOpNcN46UbXVtpKMrmU4Abg

      /**
       * @type {import('youtubei.js').YTNodes.CarouselHeader}
       */
      const header = channel.header

      /**
       * @type {import('youtubei.js').YTNodes.TopicChannelDetails}
       */
      const topicChannelDetails = header.contents.find(node => node.type === 'TopicChannelDetails')
      name = topicChannelDetails.title.text
      thumbnailUrl = topicChannelDetails.avatar[0].url

      if (channel.metadata.external_id) {
        id = channel.metadata.external_id
      } else {
        id = topicChannelDetails.subscribe_button.channel_id
      }

      if (!onlyIdNameThumbnail) {
        subscriberText = topicChannelDetails.subtitle.text
      }
      break
    }
    case 'InteractiveTabbedHeader': {
      // example: Minecraft - Topic
      // https://www.youtube.com/channel/UCQvWX73GQygcwXOTSf_VDVg

      /**
       * @type {import('youtubei.js').YTNodes.InteractiveTabbedHeader}
       */
      const header = channel.header
      name = header.title.text
      thumbnailUrl = header.box_art.at(-1).url
      id = channel.current_tab?.endpoint.payload.browseId

      if (!onlyIdNameThumbnail) {
        bannerUrl = header.banner[0]?.url

        const badges = header.badges.map(badge => badge.label).filter(tag => tag)
        tags.push(...badges)
      }
      break
    }
    case 'PageHeader': {
      // example: YouTube Gaming
      // https://www.youtube.com/channel/UCOpNcN46UbXVtpKMrmU4Abg

      // User channels (an A/B test at the time of writing)

      /**
       * @type {import('youtubei.js').YTNodes.PageHeader}
       */
      const header = channel.header

      name = header.content.title.text.text
      if (header.content.image) {
        if (header.content.image.type === 'ContentPreviewImageView') {
          /** @type {import('youtubei.js').YTNodes.ContentPreviewImageView} */
          const image = header.content.image

          thumbnailUrl = image.image[0].url
        } else {
          /** @type {import('youtubei.js').YTNodes.DecoratedAvatarView} */
          const image = header.content.image
          thumbnailUrl = image.avatar?.image[0].url
        }
      } else if (header.content.animated_image) {
        thumbnailUrl = header.content.animated_image.image[0].url
      }

      if (!thumbnailUrl && channel.metadata.thumbnail) {
        thumbnailUrl = channel.metadata.thumbnail[0].url
      }

      if (!onlyIdNameThumbnail && header.content.banner) {
        bannerUrl = header.content.banner.image[0]?.url
      }

      if (header.content.actions) {
        const modal = header.content.actions.actions_rows[0].actions[0].on_tap.modal

        if (modal && modal.type === 'ModalWithTitleAndButton') {
          /** @type {import('youtubei.js').YTNodes.ModalWithTitleAndButton} */
          const typedModal = modal

          id = typedModal.button.endpoint.next_endpoint?.payload.browseId
        }
      } else if (channel.metadata.external_id) {
        id = channel.metadata.external_id
      }

      if (!onlyIdNameThumbnail && header.content.metadata) {
        // YouTube has already changed the indexes for where the information is stored once,
        // so we should search for it instead of using hardcoded indexes, just to be safe for the future

        subscriberText = header.content.metadata.metadata_rows
          .flatMap(row => row.metadata_parts ? row.metadata_parts : [])
          .find(part => part.text?.text?.includes('subscriber'))
          ?.text?.text
      }

      break
    }
  }

  if (onlyIdNameThumbnail) {
    return {
      id,
      name,
      thumbnailUrl
    }
  }

  return {
    id,
    name,
    thumbnailUrl,
    bannerUrl,
    subscriberText,
    tags
  }
}

/**
 * @param {import('youtubei.js').YTNodes.Video[]} videos
 * @param {string} channelId
 * @param {string} channelName
 */
export function parseLocalChannelVideos(videos, channelId, channelName) {
  const parsedVideos = []

  for (const video of videos) {
    // `BADGE_STYLE_TYPE_MEMBERS_ONLY` used for both `members only` and `members first` videos
    if (video.is(YTNodes.Video) && video.badges.some(badge => badge.style === 'BADGE_STYLE_TYPE_MEMBERS_ONLY')) {
      continue
    }
    parsedVideos.push(parseLocalListVideo(video, channelId, channelName))
  }

  return parsedVideos
}

/**
 * @param {YTNodes.ReelItem | YTNodes.ShortsLockupView} short
 * @param {string} [channelId]
 * @param {string} [channelName]
 */
export function parseShort(short, channelId, channelName) {
  if (short.type === 'ReelItem') {
    /** @type {import('youtubei.js').YTNodes.ReelItem} */
    const reelItem = short

    return {
      type: 'video',
      videoId: reelItem.id,
      title: reelItem.title.text,
      author: channelName,
      authorId: channelId,
      viewCount: reelItem.views.isEmpty() ? null : parseLocalSubscriberCount(reelItem.views.text),
      lengthSeconds: ''
    }
  } else {
    /** @type {import('youtubei.js').YTNodes.ShortsLockupView} */
    const shortsLockupView = short

    return {
      type: 'video',
      videoId: shortsLockupView.on_tap_endpoint.payload.videoId,
      title: shortsLockupView.overlay_metadata.primary_text.text,
      author: channelName,
      authorId: channelId,
      viewCount: shortsLockupView.overlay_metadata.secondary_text ? parseLocalSubscriberCount(shortsLockupView.overlay_metadata.secondary_text.text) : null,
      lengthSeconds: ''
    }
  }
}

/**
 * @param {(import('youtubei.js').YTNodes.ReelItem | import('youtubei.js').YTNodes.ShortsLockupView)[]} shorts
 * @param {string} [channelId]
 * @param {string} [channelName]
 */
export function parseLocalChannelShorts(shorts, channelId, channelName) {
  return shorts.map(short => parseShort(short, channelId, channelName))
}

/**
 * @param {import('youtubei.js').YTNodes.Playlist|import('youtubei.js').YTNodes.GridPlaylist|import('youtubei.js').YTNodes.LockupView} playlist
 * @param {string} channelId
 * @param {string} channelName
 */
export function parseLocalListPlaylist(playlist, channelId = undefined, channelName = undefined) {
  if (playlist.type === 'LockupView') {
    return parseLockupView(playlist, channelId, channelName)
  } else if (playlist.type === 'CompactStation') {
    /** @type {import('youtubei.js').YTNodes.CompactStation} */
    const compactStation = playlist

    return {
      type: 'playlist',
      dataSource: 'local',
      title: compactStation.title.text,
      thumbnail: compactStation.thumbnail[1].url,
      playlistId: compactStation.endpoint.payload.playlistId,
      videoCount: extractNumberFromString(compactStation.video_count.text)
    }
  } else if (playlist.type === 'GridPlaylist') {
    /** @type {import('youtubei.js').YTNodes.GridPlaylist} */
    const gridPlaylist = playlist

    return {
      type: 'playlist',
      dataSource: 'local',
      title: gridPlaylist.title.text,
      thumbnail: gridPlaylist.thumbnails.at(0).url,
      playlistId: gridPlaylist.id,
      channelName: gridPlaylist.author?.name,
      channelId: gridPlaylist.author?.id,
      videoCount: extractNumberFromString(gridPlaylist.video_count.text)
    }
  } else {
    let internalChannelName
    let internalChannelId = null

    if (playlist.author && playlist.author.id !== 'N/A') {
      if (playlist.author instanceof Misc.Text) {
        internalChannelName = playlist.author.text

        if (channelId) {
          internalChannelId = channelId
        }
      } else {
        internalChannelName = playlist.author.name
        internalChannelId = playlist.author.id
      }
    } else if (channelId || channelName) {
      internalChannelName = channelName
      internalChannelId = channelId
    } else if (playlist.author?.name) {
      // auto-generated album playlists don't have an author
      // so in search results, the author text is "Playlist" and doesn't have a link or channel ID
      internalChannelName = playlist.author.name
    }

    /** @type {import('youtubei.js').YTNodes.PlaylistVideoThumbnail} */
    const thumbnailRenderer = playlist.thumbnail_renderer

    return {
      type: 'playlist',
      dataSource: 'local',
      title: playlist.title.text,
      thumbnail: thumbnailRenderer ? thumbnailRenderer.thumbnail[0].url : playlist.thumbnails[0].url,
      channelName: internalChannelName,
      channelId: internalChannelId,
      playlistId: playlist.id,
      videoCount: extractNumberFromString(playlist.video_count.text)
    }
  }
}

/**
 * @param {YT.Search} response
 */
function handleSearchResponse(response) {
  if (!response.results) {
    return {
      results: [],
      continuationData: null
    }
  }

  const results = response.results
    .filter((item) => {
      return item.type === 'Video' || item.type === 'Channel' || item.type === 'Playlist' || item.type === 'HashtagTile' || item.type === 'Movie' || item.type === 'LockupView'
    })
    .map((item) => parseListItem(item))
    .filter((item) => item)

  return {
    results,
    // check the length of the results, as there can be continuations for things that we've filtered out, which we don't want
    continuationData: response.has_continuation && results.length > 0 ? response : null
  }
}

/**
 * @param {import('youtubei.js').YT.Channel} homeTab
 * @param {string} [channelId]
 * @param {string} [channelName]
 */
export function parseChannelHomeTab(homeTab, channelId, channelName) {
  /**
   * @type {import('youtubei.js').YTNodes.ItemSection | import('youtubei.js').YTNodes.RichSection}
   */
  let section
  const shelves = []
  for (section of homeTab.current_tab.content.contents) {
    if (section.type === 'ItemSection') {
      /**
       * @type {import('youtubei.js').YTNodes.ItemSection}
       */
      const itemSection = section
      if (itemSection.contents.at(0).type === 'Shelf') {
        /** @type {import('youtubei.js').YTNodes.Shelf} */
        const shelf = itemSection.contents.at(0)

        const playlistId = shelf.play_all_button?.endpoint.payload.playlistId

        // filter out the members-only video section as none of the videos in that section are playable as they require a paid channel membership
        if (!playlistId || !playlistId.startsWith('UUMO')) {
          shelves.push({
            title: shelf.title.text,
            content: shelf.content.items.map((item) => parseListItem(item, channelId, channelName)).filter(_ => _),
            playlistId,
            subtitle: shelf.subtitle?.text
          })
        }
      } else if (itemSection.contents.at(0).type === 'ReelShelf') {
        /** @type {import('youtubei.js').YTNodes.ReelShelf} */
        const shelf = itemSection.contents.at(0)
        shelves.push({
          title: shelf.title.text,
          content: shelf.items.map((item) => parseListItem(item, channelId, channelName)).filter(_ => _)
        })
      } else if (itemSection.contents.at(0).type === 'HorizontalCardList') {
        /** @type {import('youtubei.js').YTNodes.HorizontalCardList} */
        const shelf = itemSection.contents.at(0)
        shelves.push({
          title: shelf.header.title.text,
          content: shelf.cards.map((item) => parseListItem(item, channelId, channelName)).filter(_ => _),
          subtitle: shelf.header.subtitle.text
        })
      }
    } else if (section.type === 'RichSection') {
      if (section.content.type === 'RichShelf') {
        /** @type {import('youtubei.js').YTNodes.RichShelf} */
        const shelf = section.content
        shelves.push({
          title: shelf.title?.text,
          content: shelf.contents.map(e => parseListItem(e.content, channelId, channelName)),
          subtitle: shelf.subtitle?.text,
          playlistId: shelf.endpoint?.metadata.url.includes('/playlist') ? shelf.endpoint?.metadata.url.replace('/playlist?list=', '') : null
        })
      }
    }
  }

  shelves.forEach(e => {
    e['isCommunity'] = e.content.at(0)?.type === 'community'
  })
  return shelves
}
/**
 * @param {import('youtubei.js').YTNodes.PlaylistVideo|import('youtubei.js').YTNodes.ReelItem|import('youtubei.js').YTNodes.ShortsLockupView} video
 */
export function parseLocalPlaylistVideo(video) {
  if (video.type === 'ReelItem') {
    /** @type {import('youtubei.js').YTNodes.ReelItem} */
    const short = video

    return {
      type: 'video',
      videoId: short.id,
      title: short.title.text,
      viewCount: parseLocalSubscriberCount(short.views.text),
      lengthSeconds: ''
    }
  } else if (video.type === 'ShortsLockupView') {
    /** @type {import('youtubei.js').YTNodes.ShortsLockupView} */
    const shortsLockupView = video

    let viewCount = null

    // the accessiblity text is the only place with the view count
    if (shortsLockupView.accessibility_text) {
      // the `.*\s+` at the start of the regex, ensures we match the last occurence
      // just in case the video title also contains that pattern
      const match = shortsLockupView.accessibility_text.match(/.*\s+(\d+(?:[,.]\d+)?\s?(?:[BKMbkm]|million)?|no)\s+views?/)

      if (match) {
        const count = match[1]

        // as it's rare that a video has no views,
        // checking the length allows us to avoid running toLowerCase unless we have to
        if (count.length === 2 && count === 'no') {
          viewCount = 0
        } else {
          const views = parseLocalSubscriberCount(count)

          if (!isNaN(views)) {
            viewCount = views
          }
        }
      }
    }

    return {
      type: 'video',
      videoId: shortsLockupView.on_tap_endpoint.payload.videoId,
      title: shortsLockupView.overlay_metadata.primary_text.text,
      viewCount,
      lengthSeconds: ''
    }
  } else {
    /** @type {import('youtubei.js').YTNodes.PlaylistVideo} */
    const video_ = video

    let viewCount = null

    const viewsText = video_.video_info.runs?.find(run => VIEWS_OR_WATCHING_REGEX.test(run.text))?.text

    if (viewsText) {
      const views = parseLocalSubscriberCount(viewsText)
      if (!isNaN(views)) {
        viewCount = views
      }
    }

    let publishedText
    // normal videos have 3 text runs with the last one containing the published date
    // OR no runs and just text with the published date (if the view count is missing)
    // live videos have 2 text runs with the number of people watching
    // upcoming either videos don't have any info text or the number of people waiting,
    // but we have the premiere date for those, so we don't need the published date

    if (!video_.is_upcoming && !video_.is_live) {
      const hasRuns = !!video_.video_info.runs

      if (hasRuns && video_.video_info.runs.length === 3) {
        publishedText = video_.video_info.runs[2].text
      } else if (!hasRuns && video_.video_info.text) {
        publishedText = video_.video_info.text
      }
    }

    const published = calculatePublishedDate(
      publishedText,
      video_.is_live,
      video_.is_upcoming,
      video_.upcoming
    )

    return {
      type: 'video',
      videoId: video_.id,
      title: video_.title.text,
      author: video_.author.name,
      authorId: video_.author.id,
      viewCount,
      published,
      lengthSeconds: isNaN(video_.duration.seconds) ? '' : video_.duration.seconds,
      liveNow: video_.is_live,
      isUpcoming: video_.is_upcoming,
      premiereDate: video_.upcoming
    }
  }
}

/**
 * @param {import('youtubei.js').YTNodes.Video | import('youtubei.js').YTNodes.Movie} item
 * @param {string} [channelId]
 * @param {string} [channelName]
 */
export function parseLocalListVideo(item, channelId, channelName) {
  if (item.type === 'Movie') {
    /** @type {import('youtubei.js').YTNodes.Movie} */
    const movie = item

    return {
      type: 'video',
      videoId: movie.id,
      title: movie.title.text,
      author: movie.author.name !== 'N/A' ? movie.author.name : channelName,
      authorId: movie.author.id !== 'N/A' ? movie.author.id : channelId,
      description: movie.description_snippet?.text,
      lengthSeconds: isNaN(movie.duration.seconds) ? '' : movie.duration.seconds,
      liveNow: false,
      isUpcoming: false,
    }
  } else if (item.type === 'GridVideo') {
    /** @type {import('youtubei.js').YTNodes.GridVideo} */
    const video = item

    let publishedText

    if (video.published != null && !video.published.isEmpty()) {
      publishedText = video.published.text
    }

    const isLive = video.duration.text === 'LIVE'

    const published = calculatePublishedDate(
      publishedText,
      video.is_live,
      video.is_upcoming || video.is_premiere,
      video.upcoming
    )

    return {
      type: 'video',
      videoId: video.video_id,
      title: video.title.text,
      author: video.author?.name ?? channelName,
      authorId: video.author?.id ?? channelId,
      viewCount: video.views.text == null ? null : extractNumberFromString(video.views.text),
      published,
      lengthSeconds: isLive ? '' : Utils.timeToSeconds(video.duration.text),
      isUpcoming: video.is_upcoming,
      premiereDate: video.upcoming,
      liveNow: isLive
    }
  } else if (item.type === 'GridMovie') {
    /** @type {import('youtubei.js').YTNodes.GridMovie} */
    const movie = item
    return {
      type: 'video',
      videoId: movie.id,
      title: movie.title.text,
      author: movie.author.name !== 'N/A' ? movie.author.name : channelName,
      authorId: movie.author.id !== 'N/A' ? movie.author.id : channelId,
      lengthSeconds: isNaN(movie.duration.seconds) ? '' : movie.duration.seconds,
      isUpcoming: movie.is_upcoming,
      premiereDate: movie.upcoming
    }
  } else {
    /** @type {import('youtubei.js').YTNodes.Video} */
    const video = item

    let publishedText

    if (video.published != null && !video.published.isEmpty()) {
      publishedText = video.published.text
    }

    const published = calculatePublishedDate(
      publishedText,
      video.is_live,
      video.is_upcoming || video.is_premiere,
      video.upcoming
    )

    let viewCount = null

    if (video.view_count?.text) {
      viewCount = video.view_count.text.toLowerCase() === 'no views' ? 0 : extractNumberFromString(video.view_count.text)
    } else if (video.short_view_count?.text) {
      viewCount = video.short_view_count.text.toLowerCase() === 'no views' ? 0 : parseLocalSubscriberCount(video.short_view_count.text)
    }

    return {
      type: 'video',
      videoId: video.video_id,
      title: video.title.text,
      author: video.author.name !== 'N/A' ? video.author.name : channelName,
      authorId: video.author.id !== 'N/A' ? video.author.id : channelId,
      description: video.description,
      viewCount,
      published,
      lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds,
      liveNow: video.is_live,
      isUpcoming: video.is_upcoming || video.is_premiere,
      premiereDate: video.upcoming,
      is4k: video.is_4k,
      is8k: video.badges.some(badge => badge.label === '8K'),
      isNew: video.badges.some(badge => badge.label === 'New'),
      isVr180: video.badges.some(badge => badge.label === 'VR180'),
      isVr360: video.badges.some(badge => badge.label === '360°'),
      is3d: video.badges.some(badge => badge.label === '3D'),
      hasCaptions: video.has_captions
    }
  }
}

const VIEWS_OR_WATCHING_REGEX = /views?|watching/i

/**
 * @param {import('youtubei.js').YTNodes.LockupView} lockupView
 * @param {string | undefined} channelId
 * @param {string | undefined} channelName
 */
function parseLockupView(lockupView, channelId = undefined, channelName = undefined) {
  switch (lockupView.content_type) {
    case 'ALBUM':
    case 'PLAYLIST':
    case 'PODCAST': {
      const thumbnailOverlayBadgeView = lockupView.content_image.primary_thumbnail.overlays
        .find(overlay => overlay.is(YTNodes.ThumbnailOverlayBadgeView))

      const playlistId = lockupView.content_id

      // Filter out mixes without playlist pages (we don't support watch page-only mixes)
      // https://wiki.archiveteam.org/index.php/YouTube/Technical_details#Playlists
      if (playlistId.startsWith('RD') && !playlistId.startsWith('RDCL')) {
        return null
      }

      const maybeChannelText = lockupView.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text

      if (maybeChannelText && maybeChannelText.endpoint?.metadata.page_type === 'WEB_PAGE_TYPE_CHANNEL') {
        channelName = maybeChannelText.text
        channelId = maybeChannelText.endpoint.payload.browseId
      }

      return {
        type: 'playlist',
        dataSource: 'local',
        playlistId,
        title: lockupView.metadata.title.text,
        thumbnail: lockupView.content_image.primary_thumbnail.image[0].url,
        channelName,
        channelId,
        videoCount: extractNumberFromString(thumbnailOverlayBadgeView.badges[0].text)
      }
    }
    case 'VIDEO': {
      let publishedText
      let lengthSeconds = ''
      let liveNow = false
      let isUpcoming = false
      let premiereDate

      /** @type {YTNodes.ThumbnailOverlayBadgeView | undefined} */
      const thumbnailOverlayBadgeView = lockupView.content_image?.overlays?.firstOfType(YTNodes.ThumbnailOverlayBadgeView)

      if (thumbnailOverlayBadgeView) {
        if (thumbnailOverlayBadgeView.badges.some(badge => badge.badge_style === 'THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE')) {
          liveNow = true
        } else if (thumbnailOverlayBadgeView.badges.some(badge => badge.text.toLowerCase() === 'upcoming')) {
          isUpcoming = true

          if (lockupView.metadata.metadata?.metadata_rows[1].metadata_parts?.[1].text?.text) {
            premiereDate = new Date(lockupView.metadata.metadata.metadata_rows[1].metadata_parts[1].text.text)
          }
        } else {
          const durationBadge = thumbnailOverlayBadgeView.badges.find(badge => /^[\d:]+$/.test(badge.text))

          if (durationBadge) {
            lengthSeconds = Utils.timeToSeconds(durationBadge.text)
          }

          publishedText = lockupView.metadata.metadata?.metadata_rows[1].metadata_parts?.find(part => part.text?.text?.endsWith('ago'))?.text?.text
        }
      }

      let viewCount = null

      const viewsText = lockupView.metadata.metadata?.metadata_rows[1].metadata_parts?.find(part => {
        return part.text?.text && VIEWS_OR_WATCHING_REGEX.test(part.text.text)
      })?.text?.text

      if (viewsText) {
        const views = parseLocalSubscriberCount(viewsText)

        if (!isNaN(views)) {
          viewCount = views
        }
      }

      return {
        type: 'video',
        videoId: lockupView.content_id,
        title: lockupView.metadata.title.text,
        author: lockupView.metadata.metadata?.metadata_rows[0].metadata_parts?.[0].text?.text,
        authorId: lockupView.metadata.image?.renderer_context?.command_context?.on_tap?.payload.browseId,
        viewCount,
        published: calculatePublishedDate(publishedText, liveNow, isUpcoming, premiereDate),
        lengthSeconds,
        liveNow,
        isUpcoming,
        premiereDate
      }
    }
    default:
      console.warn(`Unknown lockup content type: ${lockupView.content_type}`, lockupView)
      return null
  }
}

/**
 * @param {import('youtubei.js').Helpers.YTNode} item
 * @param {string} [channelId]
 * @param {string} [channelName]
 */
function parseListItem(item, channelId, channelName) {
  switch (item.type) {
    case 'Movie':
    case 'Video':
    case 'GridVideo':
    case 'GridMovie':
    case 'VideoCard':
      return parseLocalListVideo(item, channelId, channelName)
    case 'GameCard': {
      /** @type {import('youtubei.js').YTNodes.GameCard} */
      const channel = item
      /** @type {import('youtubei.js').YTNodes.GameDetails} */
      const game = channel.game
      return {
        type: 'channel',
        dataSource: 'local',
        thumbnail: game.box_art.at(0).url.replace(/^\/\//, 'https://'),
        name: game.title.text,
        id: game.endpoint.payload.browseId,
        isGame: true
      }
    }
    case 'GridChannel': {
      /** @type {import('youtubei.js').YTNodes.GridChannel} */
      const channel = item
      let subscribers = null
      let videos = null

      if (channel.subscribers?.text) {
        subscribers = parseLocalSubscriberCount(channel.subscribers.text)
      }

      videos = extractNumberFromString(channel.video_count.text)

      return {
        type: 'channel',
        dataSource: 'local',
        thumbnail: channel.author.best_thumbnail?.url.replace(/^\/\//, 'https://'),
        name: channel.author.name,
        id: channel.author.id,
        subscribers,
        videos,
        handle: null,
        descriptionShort: channel.description_snippet?.text
      }
    }
    case 'Channel': {
      /** @type {import('youtubei.js').YTNodes.Channel} */
      const channel = item

      // see upstream TODO: https://github.com/LuanRT/YouTube.js/blob/main/src/parser/classes/Channel.ts#L33

      // according to https://github.com/iv-org/invidious/issues/3514#issuecomment-1368080392
      // the response can be the new or old one, so we currently need to handle both here
      let subscribers = null
      let videos = null
      let handle = null
      if (channel.subscriber_count.text?.startsWith('@')) {
        handle = channel.subscriber_count.text

        if (!channel.video_count.isEmpty()) {
          subscribers = parseLocalSubscriberCount(channel.video_count.text)
        }
      } else {
        videos = extractNumberFromString(channel.video_count.text)

        if (!channel.subscriber_count.isEmpty()) {
          subscribers = parseLocalSubscriberCount(channel.subscriber_count.text)
        }
      }

      return {
        type: 'channel',
        dataSource: 'local',
        thumbnail: channel.author.best_thumbnail?.url.replace(/^\/\//, 'https://'),
        name: channel.author.name,
        id: channel.author.id,
        subscribers,
        videos,
        handle,
        descriptionShort: channel.description_snippet.text
      }
    }
    case 'HashtagTile': {
      /** @type {import('youtubei.js').YTNodes.HashtagTile} */
      const hashtag = item

      return {
        type: 'hashtag',
        title: hashtag.hashtag.text,
        videoCount: hashtag.hashtag_video_count.isEmpty() ? null : parseLocalSubscriberCount(hashtag.hashtag_video_count.text),
        channelCount: hashtag.hashtag_channel_count.isEmpty() ? null : parseLocalSubscriberCount(hashtag.hashtag_channel_count.text)
      }
    }
    case 'ReelItem':
    case 'ShortsLockupView': {
      return parseShort(item, channelId, channelName)
    }
    case 'CompactStation':
    case 'GridPlaylist':
    case 'Playlist': {
      return parseLocalListPlaylist(item, channelId, channelName)
    }
    case 'Post': {
      return parseLocalCommunityPost(item)
    }
    case 'LockupView':
      return parseLockupView(item, channelId, channelName)
  }
}

/**
 * @param {YTNodes.CompactVideo | YTNodes.CompactMovie | YTNodes.LockupView} video
 */
export function parseLocalWatchNextVideo(video) {
  if (video.is(YTNodes.CompactMovie)) {
    return {
      type: 'video',
      videoId: video.id,
      title: video.title.text,
      author: video.author.name,
      authorId: video.author.id,
      lengthSeconds: video.duration.seconds
    }
  } else if (video.is(YTNodes.LockupView)) {
    return parseLockupView(video)
  } else {
    let publishedText

    if (video.published != null && !video.published.isEmpty()) {
      publishedText = video.published.text
    }

    const published = calculatePublishedDate(publishedText, video.is_live, video.is_premiere)

    return {
      type: 'video',
      videoId: video.video_id,
      title: video.title.text,
      author: video.author.name,
      authorId: video.author.id,
      viewCount: video.view_count == null ? null : extractNumberFromString(video.view_count.text),
      published,
      lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds,
      liveNow: video.is_live,
      isUpcoming: video.is_premiere
    }
  }
}

function convertSearchFilters(filters) {
  const convertedFilters = {}

  // some of the fields have different names and
  // others have empty strings that we don't want to pass to youtubei.js

  if (filters) {
    if (filters.sortBy) {
      convertedFilters.sort_by = filters.sortBy
    }

    if (filters.time) {
      convertedFilters.upload_date = filters.time
    }

    if (filters.type) {
      convertedFilters.type = filters.type
    }

    if (filters.duration) {
      convertedFilters.duration = filters.duration
    }

    if (filters.features) {
      convertedFilters.features = filters.features
    }
  }

  return convertedFilters
}

/**
 * @param {(Misc.TextRun|Misc.EmojiRun)[]} runs
 * @param {number} emojiSize
 * @param {{looseChannelNameDetection: boolean}} options
 */
export function parseLocalTextRuns(runs, emojiSize = 16, options = { looseChannelNameDetection: false }) {
  if (!Array.isArray(runs)) {
    throw new Error('not an array of text runs')
  }

  const timestampRegex = /^(?:\d+:){1,2}\d+$/
  const spacesBeforeRegex = /^\s+/
  const spacesAfterRegex = /\s+$/
  const parsedRuns = []

  for (const run of runs) {
    // may contain HTML, so we need to escape it, as we don't render unwanted HTML
    // example: https://youtu.be/Hh_se2Zqsdk (see pinned comment)
    const text = escapeHTML(run.text)

    if (run instanceof Misc.EmojiRun) {
      const { emoji } = run

      // empty array if video creator removes a channel emoji so we ignore.
      // eg: pinned comment here https://youtu.be/v3wm83zoSSY
      if (emoji.image.length > 0) {
        let altText

        if (emoji.is_custom) {
          if (emoji.shortcuts.length > 0) {
            altText = emoji.shortcuts[0]
          } else if (emoji.search_terms.length > 0) {
            altText = emoji.search_terms.join(', ')
          } else {
            altText = 'Custom emoji'
          }
        } else {
          altText = text
        }

        // lazy load the emoji image so it doesn't delay rendering of the text
        // by defining a height and width, that space is reserved until the image is loaded
        // that way we avoid layout shifts when it loads
        parsedRuns.push(`<img src="${emoji.image[0].url}" alt="${altText}" width="${emojiSize}" height="${emojiSize}" loading="lazy" style="vertical-align: middle">`)
      }
    } else {
      const { bold, italics, strikethrough, endpoint } = run

      if (endpoint) {
        switch (endpoint.metadata.page_type) {
          case 'WEB_PAGE_TYPE_WATCH':
            if (timestampRegex.test(text)) {
              parsedRuns.push(text)
            } else {
              parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            }
            break
          case 'WEB_PAGE_TYPE_CHANNEL': {
            const trimmedText = text.trim()
            // In comments, mention can be `@Channel Name` (not handle, but name)
            if (CHANNEL_HANDLE_REGEX.test(trimmedText) || options.looseChannelNameDetection) {
              // Note that in regex `\s` must be used since the text contain non-default space (the half-width space char when we press spacebar)
              const spacesBefore = (spacesBeforeRegex.exec(text) || [''])[0]
              const spacesAfter = (spacesAfterRegex.exec(text) || [''])[0]
              parsedRuns.push(`${spacesBefore}<a href="https://www.youtube.com/channel/${endpoint.payload.browseId}">${trimmedText}</a>${spacesAfter}`)
            } else {
              parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            }
            break
          }
          case 'WEB_PAGE_TYPE_PLAYLIST':
          case 'WEB_PAGE_TYPE_SHORTS':
            parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            break
          case 'WEB_PAGE_TYPE_BROWSE':
            parsedRuns.push(`<a href="https://www.youtube.com${endpoint.metadata.url}">${text}</a>`)
            break
          case 'WEB_PAGE_TYPE_UNKNOWN':
          default: {
            const url = new URL((endpoint.dialog?.type === 'ConfirmDialog' && endpoint.dialog.confirm_button.endpoint.payload.url) || endpoint.payload.url)
            if (url.hostname === 'www.youtube.com' && url.pathname === '/redirect' && url.searchParams.has('q')) {
              // remove utm tracking parameters
              const realURLStr = url.searchParams.get('q')
              const realURL = new URL(realURLStr)
              let urlChanged = false

              TRACKING_PARAM_NAMES.forEach((paramName) => {
                if (!realURL.searchParams.has(paramName)) { return }

                realURL.searchParams.delete(paramName)
                urlChanged = true
              })

              // `searchParams.delete` changes query string unnecessarily
              // Using original unless there is any change
              parsedRuns.push(urlChanged ? realURL.toString() : realURLStr)
            } else {
              // this is probably a special YouTube URL like http://www.youtube.com/approachingnirvana
              parsedRuns.push(endpoint.payload.url)
            }
            break
          }
        }
      } else {
        let formattedText = text
        if (bold) {
          formattedText = `<b>${formattedText}</b>`
        }

        if (italics) {
          formattedText = `<i>${formattedText}</i>`
        }

        if (strikethrough) {
          formattedText = `<s>${formattedText}</s>`
        }

        parsedRuns.push(formattedText)
      }
    }
  }

  return parsedRuns.join('')
}

/**
 * @param {LocalFormat} format
 */
export function mapLocalLegacyFormat(format) {
  return {
    itag: format.itag,
    qualityLabel: format.quality_label,
    fps: format.fps,
    bitrate: format.bitrate,
    mimeType: format.mime_type,
    height: format.height,
    width: format.width,
    url: format.freeTubeUrl
  }
}

/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {object} LocalComment
 * @property {string} id
 * @property {string} dataType
 * @property {string} authorLink
 * @property {string} author
 * @property {string} authorId
 * @property {string} authorThumb
 * @property {boolean} isPinned
 * @property {boolean} isOwner
 * @property {boolean} isMember
 * @property {string} text
 * @property {boolean} isHearted
 * @property {boolean} hasOwnerReplied
 * @property {boolean} hasReplyToken
 * @property {CommentThread} replyToken
 * @property {boolean} showReplies
 * @property {LocalComment[]} replies
 * @property {string} memberIconUrl
 * @property {string} time
 * @property {number} likes
 * @property {number} numReplies
 */
/**
 * @param {import('youtubei.js').YTNodes.CommentView} comment
 * @param {import('youtubei.js').YTNodes.CommentThread} commentThread
 * @return LocalComment
 */
export function parseLocalComment(comment, commentThread = undefined) {
  let hasOwnerReplied = false
  let replyToken = null
  let hasReplyToken = false

  if (commentThread?.has_replies) {
    hasOwnerReplied = commentThread.comment_replies_data.has_channel_owner_replied
    replyToken = commentThread
    hasReplyToken = true
  }

  const commentTextRuns = comment.voice_reply_container?.transcript_text ? comment.voice_reply_container.transcript_text.runs : comment.content.runs

  return {
    id: comment.comment_id,
    dataType: 'local',
    authorLink: comment.author.id,
    author: comment.author.name,
    authorId: comment.author.id,
    authorThumb: comment.author.best_thumbnail.url,
    isPinned: comment.is_pinned,
    isOwner: !!comment.author_is_channel_owner,
    isMember: !!comment.is_member,
    text: Autolinker.link(parseLocalTextRuns(commentTextRuns, 16, { looseChannelNameDetection: true })),
    isHearted: !!comment.is_hearted,
    hasOwnerReplied,
    hasReplyToken,
    replyToken,
    showReplies: false,
    replies: [],
    memberIconUrl: comment.is_member ? comment.member_badge.url : '',
    time: getRelativeTimeFromDate(calculatePublishedDate(comment.published_time.replace('(edited)', '').trim()), false),
    likes: comment.like_count,
    numReplies: parseLocalSubscriberCount(comment.reply_count)
  }
}

/**
 * @param {string} text
 */
export function parseLocalSubscriberCount(text) {
  const match = text.match(/(\d+)(?:[,.](\d+))?\s?([BKMbkm]|million)\b/)

  if (match) {
    let multiplier = 0

    switch (match[3]) {
      case 'K':
      case 'k':
        multiplier = 3
        break
      case 'M':
      case 'm':
      case 'million':
        multiplier = 6
        break
      case 'B':
      case 'b':
        multiplier = 9
        break
    }

    let parsedDecimals
    if (typeof match[2] === 'undefined') {
      parsedDecimals = '0'.repeat(multiplier)
    } else {
      parsedDecimals = match[2].padEnd(multiplier, '0')
    }

    return parseInt(match[1] + parsedDecimals)
  } else {
    return extractNumberFromString(text)
  }
}

/**
 * Parse community posts
 * @param {import('youtubei.js').YTNodes.BackstagePost[] | import('youtubei.js').YTNodes.SharedPost[] | import('youtubei.js').YTNodes.Post[] } posts
 */
export function parseLocalCommunityPosts(posts) {
  const foundIds = []
  // `posts` includes the SharedPost's attached post for some reason so we need to filter that out.
  // see: https://github.com/FreeTubeApp/FreeTube/issues/3252#issuecomment-1546675781
  // we don't currently support SharedPost's so that is also filtered out
  for (const post of posts) {
    if (post.type === 'SharedPost') {
      foundIds.push(post.original_post.id, post.id)
    }
  }

  return posts.filter(post => {
    return !foundIds.includes(post.id)
  }).map(parseLocalCommunityPost)
}

/**
 * Parse community post
 * @param {import('youtubei.js').YTNodes.BackstagePost} post
 */
function parseLocalCommunityPost(post) {
  let replyCount = post.action_buttons?.reply_button?.text ?? null
  if (replyCount !== null) {
    replyCount = parseLocalSubscriberCount(post?.action_buttons.reply_button.text)
  }

  const authorThumbnails = post.author.thumbnails

  authorThumbnails.forEach((thumbnail) => {
    if (thumbnail.url.startsWith('//')) {
      thumbnail.url = 'https:' + thumbnail.url
    }
  })

  return {
    postText: post.content.isEmpty() ? '' : Autolinker.link(parseLocalTextRuns(post.content.runs, 16)),
    postId: post.id,
    authorThumbnails,
    publishedTime: calculatePublishedDate(post.published.text),
    // YouTube hides the vote/like count on posts when it is zero
    voteCount: post.vote_count ? parseLocalSubscriberCount(post.vote_count.text) : 0,
    postContent: parseLocalAttachment(post.attachment),
    commentCount: replyCount,
    authorId: post.author.id,
    author: post.author.name,
    type: 'community'
  }
}

function parseLocalAttachment(attachment) {
  if (!attachment) {
    return null
  }
  // image post
  if (attachment.type === 'BackstageImage') {
    return {
      type: 'image',
      content: attachment.image
    }
  } else if (attachment.type === 'Video') {
    return {
      type: 'video',
      content: parseLocalListVideo(attachment)
    }
  } else if (attachment.type === 'Playlist') {
    return {
      type: 'playlist',
      content: parseLocalListPlaylist(attachment)
    }
  } else if (attachment.type === 'PostMultiImage') {
    return {
      type: 'multiImage',
      content: attachment.images.map(thumbnail => thumbnail.image)
    }
  } else if (attachment.type === 'Poll') {
    return {
      type: 'poll',
      totalVotes: parseLocalSubscriberCount(attachment.total_votes.text) ?? 0,
      content: attachment.choices.map(choice => {
        return {
          text: choice.text.text,
          image: choice.image
        }
      })
    }
  } else if (attachment.type === 'Quiz') {
    return {
      type: 'quiz',
      totalVotes: parseLocalSubscriberCount(attachment.total_votes.text) ?? 0,
      content: Object.values(attachment.choices).map(choice => {
        return {
          text: choice.text.text,
          isCorrect: choice.is_correct,
          image: choice.image
        }
      })
    }
  } else {
    console.error(`Unknown Local community post type: ${attachment.type}`)
    console.error(attachment)
  }
}

export async function getHashtagLocal(hashtag) {
  const innertube = await createInnertube()
  return await innertube.getHashtag(hashtag)
}

export async function getLocalCommunityPost(postId, channelId) {
  const innertube = await createInnertube()
  if (channelId == null) {
    channelId = await getLocalChannelId('https://www.youtube.com/post/' + postId, true)
  }

  const postPage = await innertube.getPost(postId, channelId)
  return parseLocalCommunityPost(postPage.posts[0])
}

/**
 * @param {string} postId
 * @param {string} channelId
 */
export async function getLocalCommunityPostComments(postId, channelId) {
  const innertube = await createInnertube()

  return await innertube.getPostComments(postId, channelId)
}
