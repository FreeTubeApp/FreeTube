export const SORT_BY_VALUES = {
  DateAddedNewest: 'date_added_descending',
  DateAddedOldest: 'date_added_ascending',
  AuthorAscending: 'author_ascending',
  AuthorDescending: 'author_descending',
  VideoTitleAscending: 'video_title_ascending',
  VideoTitleDescending: 'video_title_descending',
  Custom: 'custom'
}

export function getSortedPlaylistItems(playlistItems, sortOrder, locale) {
  if (sortOrder === SORT_BY_VALUES.Custom) {
    return playlistItems
  }

  return playlistItems.toSorted((a, b) => {
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
  })
}
