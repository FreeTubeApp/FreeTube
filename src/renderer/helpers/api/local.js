import { Innertube } from 'youtubei.js'

let searchSuggestionsInnerTube = null

export async function getYTSearchSuggestions(query) {
  // reuse innertube instance to keep the search suggestions snappy
  if (searchSuggestionsInnerTube === null) {
    searchSuggestionsInnerTube = await Innertube.create({
      // use browser fetch
      fetch: (input, init) => fetch(input, init)
    })
  }

  return await searchSuggestionsInnerTube.getSearchSuggestions(query)
}

export function clearYTSearchSuggestionsSession() {
  searchSuggestionsInnerTube = null
}
