import { Innertube } from 'youtubei.js'

let searchSuggestionsSession = null

export async function getLocalSearchSuggestions(query) {
  // reuse innertube instance to keep the search suggestions snappy
  if (searchSuggestionsSession === null) {
    searchSuggestionsSession = await Innertube.create({
      // use browser fetch
      fetch: (input, init) => fetch(input, init)
    })
  }

  return await searchSuggestionsSession.getSearchSuggestions(query)
}

export function clearLocalSearchSuggestionsSession() {
  searchSuggestionsSession = null
}
