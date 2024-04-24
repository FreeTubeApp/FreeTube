export const SORT_BY_VALUES = {
  DateAddedNewest: 'date_added_descending',
  DateAddedOldest: 'date_added_ascending',
  AuthorAscending: 'author_ascending',
  AuthorDescending: 'author_descending',
  VideoTitleAscending: 'video_title_ascending',
  VideoTitleDescending: 'video_title_descending',
  Custom: 'custom'
}

export function getSortedPlaylistItems(playlistItems, sortOrder, locale, reversed = false) {
  if (sortOrder === SORT_BY_VALUES.Custom) {
    return reversed ? playlistItems.toReversed() : playlistItems
  }

  return playlistItems.toSorted((a, b) => {
    const first = !reversed ? a : b
    const second = !reversed ? b : a
    return compareTwoPlaylistItems(first, second, sortOrder, locale)
  })
}

function compareTwoPlaylistItems(a, b, sortOrder, locale) {
  switch (sortOrder) {
    case SORT_BY_VALUES.DateAddedNewest:
      return b.timeAdded - a.timeAdded
    case SORT_BY_VALUES.DateAddedOldest:
      return a.timeAdded - b.timeAdded
    case SORT_BY_VALUES.VideoTitleAscending:
      return a.title.localeCompare(b.title, locale)
    case SORT_BY_VALUES.VideoTitleDescending:
      return b.title.localeCompare(a.title, locale)
    case SORT_BY_VALUES.AuthorAscending:
      return a.author.localeCompare(b.author, locale)
    case SORT_BY_VALUES.AuthorDescending:
      return b.author.localeCompare(a.author, locale)
    default:
      console.error(`Unknown sortOrder: ${sortOrder}`)
      return 0
  }
}
