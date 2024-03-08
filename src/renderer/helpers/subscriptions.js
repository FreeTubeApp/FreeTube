import store from '../store/index'
import { calculatePublishedDate } from './utils'

/**
 * Filtering and sort based on user preferences
 * @param {any[]} videos
 */
export function updateVideoListAfterProcessing(videos) {
  let videoList = videos

  if (store.getters.getHideLiveStreams) {
    videoList = videoList.filter(item => {
      return (!item.liveNow && !item.isUpcoming)
    })
  }

  if (store.getters.getHideUpcomingPremieres) {
    videoList = videoList.filter(item => {
      if (item.isRSS) {
        // viewCount is our only method of detecting premieres in RSS
        // data without sending an additional request.
        // If we ever get a better flag, use it here instead.
        return item.viewCount !== '0'
      }
      // Observed for premieres in Local API Subscriptions.
      return (item.premiereDate == null ||
        // Invidious API
        // `premiereTimestamp` only available on premiered videos
        // https://docs.invidious.io/api/common_types/#videoobject
        item.premiereTimestamp == null
      )
    })
  }

  if (store.getters.getHideWatchedSubs) {
    const historyCacheById = store.getters.getHistoryCacheById

    videoList = videoList.filter((video) => {
      return !Object.hasOwn(historyCacheById, video.videoId)
    })
  }

  // ordered last to show first eligible video from channel
  // if the first one incidentally failed one of the above checks
  if (store.getters.getOnlyShowLatestFromChannel) {
    const authors = new Set()
    videoList = videoList.filter((video) => {
      if (!video.authorId) {
        return true
      } else if (!authors.has(video.authorId)) {
        authors.add(video.authorId)
        return true
      }

      return false
    })
  }

  videoList.sort((a, b) => {
    return b.publishedDate - a.publishedDate
  })

  return videoList
}

/**
 * @param {string} rssString
 * @param {string} channelId
*/
export async function parseYouTubeRSSFeed(rssString, channelId) {
  // doesn't need to be asynchronous, but doing it allows us to do the relatively slow DOM querying in parallel
  try {
    const xmlDom = new DOMParser().parseFromString(rssString, 'application/xml')
    const channelName = xmlDom.querySelector('author > name').textContent
    const entries = xmlDom.querySelectorAll('entry')

    const promises = []

    for (const entry of entries) {
      promises.push(parseRSSEntry(entry, channelId, channelName))
    }

    return {
      name: channelName,
      videos: await Promise.all(promises)
    }
  } catch (e) {
    return {
      videos: []
    }
  }
}

/**
 * @param {Element} entry
 * @param {string} channelId
 * @param {string} channelName
 */
async function parseRSSEntry(entry, channelId, channelName) {
  // doesn't need to be asynchronous, but doing it allows us to do the relatively slow DOM querying in parallel
  const published = new Date(entry.querySelector('published').textContent)
  const viewCount = entry.getElementsByTagName('media:statistics')[0]?.getAttribute('views') || null

  return {
    authorId: channelId,
    author: channelName,
    // querySelector doesn't support xml namespaces so we have to use getElementsByTagName here
    videoId: entry.getElementsByTagName('yt:videoId')[0].textContent,
    title: entry.querySelector('title').textContent,
    publishedDate: published,
    publishedText: published.toLocaleString(),
    viewCount: viewCount ? parseInt(viewCount) : null,
    type: 'video',
    lengthSeconds: '0:00',
    isRSS: true
  }
}

/**
 * @param {{
 *  liveNow: boolean,
 *  isUpcoming: boolean,
 *  premiereDate: Date,
 *  publishedText: string,
 *  publishedDate: number
 * }[]} videos publishedDate is added by this function,
 * but adding it to the type definition stops vscode warning that the property doesn't exist
 */
export function addPublishedDatesLocal(videos) {
  videos.forEach(video => {
    if (video.liveNow) {
      video.publishedDate = new Date().getTime()
    } else if (video.isUpcoming) {
      video.publishedDate = video.premiereDate
    } else {
      video.publishedDate = calculatePublishedDate(video.publishedText)
    }
    return video
  })
}

/**
 * @param {{
 *  liveNow: boolean,
 *  isUpcoming: boolean,
 *  premiereTimestamp: number,
 *  published: number,
 *  publishedDate: number
 * }[]} videos publishedDate is added by this function,
 * but adding it to the type definition stops vscode warning that the property doesn't exist
 */
export function addPublishedDatesInvidious(videos) {
  videos.forEach(video => {
    if (video.liveNow) {
      video.publishedDate = new Date().getTime()
    } else if (video.isUpcoming) {
      video.publishedDate = new Date(video.premiereTimestamp * 1000)
    } else {
      video.publishedDate = new Date(video.published * 1000)
    }
    return video
  })
}
