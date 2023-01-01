import { Innertube, Session } from 'youtubei.js'
import { join } from 'path'

import { PlayerCache } from './PlayerCache'
import { extractNumberFromString, getUserDataPath } from '../utils'

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
 * @returns the Innertube instance
 */
async function createInnertube(options = { withPlayer: false, location: undefined }) {
  if (options.withPlayer) {
    const userData = await getUserDataPath()

    return await Innertube.create({
      // use browser fetch
      location: options.location,
      fetch: (input, init) => fetch(input, init),
      cache: new PlayerCache(join(userData, 'player_cache'))
    })
  } else {
    // from https://github.com/LuanRT/YouTube.js/pull/240
    const sessionData = await Session.getSessionData(undefined, options.location)

    const session = new Session(
      sessionData.context,
      sessionData.api_key,
      sessionData.api_version,
      sessionData.account_index,
      undefined, // player
      undefined, // cookies
      (input, init) => fetch(input, init) // use browser fetch
    )

    return new Innertube(session)
  }
}

let searchSuggestionsSession = null

export async function getLocalSearchSuggestions(query) {
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
 * @typedef {import('youtubei.js/dist/src/core/TabbedFeed').default} TabbedFeed
 */

/**
 * @param {string} location
 * @param {string} tab
 * @param {TabbedFeed|null} instance
 */
export async function getLocalTrending(location, tab, instance) {
  if (instance === null) {
    const innertube = await createInnertube({ location })
    instance = await innertube.getTrending()
  }

  // youtubei.js's tab names are localised, so we need to use the index to get tab name that youtubei.js expects
  const tabIndex = ['default', 'music', 'gaming', 'movies'].indexOf(tab)
  const resultsInstance = await instance.getTabByName(instance.tabs[tabIndex])

  const results = resultsInstance.videos
    .filter((video) => video.type === 'Video')
    .map(parseLocalListVideo)

  return {
    results,
    instance: resultsInstance
  }
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/classes/PlaylistVideo').default} PlaylistVideo
 */

/**
 * @param {PlaylistVideo} video
 */
export function parseLocalPlaylistVideo(video) {
  return {
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds
  }
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/classes/Video').default} Video
 */

/**
 * @param {Video} video
 */
function parseLocalListVideo(video) {
  return {
    type: 'video',
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    description: video.description,
    viewCount: extractNumberFromString(video.view_count.text),
    publishedText: video.published.text,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds,
    liveNow: video.is_live
  }
}
