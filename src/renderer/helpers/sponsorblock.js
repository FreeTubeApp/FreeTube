import store from '../store/index'

async function getVideoHash(videoId) {
  const videoIdBuffer = new TextEncoder().encode(videoId)
  const hashBuffer = await crypto.subtle.digest('SHA-256', videoIdBuffer)
  const hashArray = new Uint8Array(hashBuffer)
  return hashArray[0].toString(16).padStart(2, '0') +
    hashArray[1].toString(16).padStart(2, '0')
}

/**
 * @typedef {'sponsor' | 'selfpromo' | 'interaction' | 'intro' | 'outro' | 'preview' | 'music_offtopic' | 'filler'} SponsorBlockCategory
 */

/**
 * @param {string} videoId
 * @param {SponsorBlockCategory[]} categories
 * @returns {Promise<{
 *   UUID: string,
 *   actionType: string,
 *   category: SponsorBlockCategory,
 *   description: string,
 *   locked: 1|0,
 *   segment: [
 *     number,
 *     number
 *   ],
 *   videoDuration: number,
 *   votes: number
 * }[]>}
 */
export async function sponsorBlockSkipSegments(videoId, categories) {
  const videoIdHashPrefix = await getVideoHash(videoId)
  const requestUrl = `${store.getters.getSponsorBlockUrl}/api/skipSegments/${videoIdHashPrefix}?categories=${JSON.stringify(categories)}`

  try {
    const response = await fetch(requestUrl)

    // 404 means that there are no segments registered for the video
    if (response.status === 404) {
      return []
    }

    // Sometimes the sponsor block server goes down or returns other errors
    if (!response.ok) {
      throw new Error(await response.text())
    }

    const json = await response.json()
    return json
      .filter((result) => result.videoID === videoId)
      .flatMap((result) => result.segments)
  } catch (error) {
    console.error('failed to fetch SponsorBlock segments', requestUrl, error)
    throw error
  }
}

export async function deArrowData(videoId) {
  const videoIdHashPrefix = await getVideoHash(videoId)
  const deArrowCasualMode = store.getters.getDeArrowCasualMode

  // When casual mode is enabled we request all titles (including those with
  // negative scores) so that upvoted original titles are also included in the
  // response.  The server already returns data in quality order, so we can
  // still rely on position when picking the best non-original title as a
  // fallback.
  const requestUrl = `${store.getters.getSponsorBlockUrl}/api/branding/${videoIdHashPrefix}${deArrowCasualMode ? '?fetchAll=true' : ''}`

  try {
    const response = await fetch(requestUrl)

    // 404 means that there are no segments registered for the video
    if (response.status === 404) {
      return undefined
    }

    const json = await response.json()
    const videoData = json[videoId] ?? undefined

    if (videoData === undefined) {
      return undefined
    }

    // Attach the current mode so the consumer can make the right selection
    // decision without having to reach back into the store.
    return { ...videoData, casualMode: deArrowCasualMode }
  } catch (error) {
    console.error('failed to fetch DeArrow data', requestUrl, error)
    throw error
  }
}

export async function deArrowThumbnail(videoId, timestamp) {
  let requestUrl = `${store.getters.getDeArrowThumbnailGeneratorUrl}/api/v1/getThumbnail?videoID=` + videoId

  if (timestamp != null) {
    requestUrl += `&time=${timestamp}`
  }

  try {
    const response = await fetch(requestUrl)

    // 204 means that there are no thumbnails found for the video
    if (response.status === 204) {
      return undefined
    }

    if (response.ok) {
      return response.url
    }

    // this usually means that a thumbnail was not generated on the server yet so we'll log the error but otherwise ignore it.
    const json = await response.json()
    console.error(json)
    return undefined
  } catch (error) {
    console.error('failed to fetch DeArrow data', requestUrl, error)
    throw error
  }
}
