import { Innertube, Session } from 'youtubei.js'
import { join } from 'path'

import { PlayerCache } from './PlayerCache'
import { getUserDataPath } from '../utils'

/**
 * Creates a lightweight Innertube instance, which is faster to create or
 * an instance that can decode the streaming URLs, which is slower to create
 * the lightweight one only needs a single web request to create the new session
 * the full one needs 3 (or 2 if the player is cached) web requests to create:
 * 1. the request for the session
 * 2. fetch a page that contains a link to the player
 * 3. if the player isn't cached, it is downloaded and transformed
 * @param {boolean} withPlayer set to true to get an Innertube instance that can decode the streaming URLs
 * @returns the Innertube instance
 */
async function createInnertube(withPlayer = false) {
  if (withPlayer) {
    const userData = await getUserDataPath()

    return await Innertube.create({
      // use browser fetch
      fetch: (input, init) => fetch(input, init),
      cache: new PlayerCache(join(userData, 'player_cache'))
    })
  } else {
    // from https://github.com/LuanRT/YouTube.js/pull/240
    const sessionData = await Session.getSessionData()

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
