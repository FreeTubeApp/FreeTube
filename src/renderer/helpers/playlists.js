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

  let collator

  if (
    sortOrder === SORT_BY_VALUES.VideoTitleAscending ||
    sortOrder === SORT_BY_VALUES.VideoTitleDescending ||
    sortOrder === SORT_BY_VALUES.AuthorAscending ||
    sortOrder === SORT_BY_VALUES.AuthorDescending
  ) {
    collator = new Intl.Collator([locale, 'en'])
  }

  return playlistItems.toSorted((a, b) => {
    const first = !reversed ? a : b
    const second = !reversed ? b : a
    return compareTwoPlaylistItems(first, second, sortOrder, collator)
  })
}

function compareTwoPlaylistItems(a, b, sortOrder, collator) {
  switch (sortOrder) {
    case SORT_BY_VALUES.DateAddedNewest:
      return b.timeAdded - a.timeAdded
    case SORT_BY_VALUES.DateAddedOldest:
      return a.timeAdded - b.timeAdded
    case SORT_BY_VALUES.VideoTitleAscending:
      return collator.compare(a.title, b.title)
    case SORT_BY_VALUES.VideoTitleDescending:
      return collator.compare(b.title, a.title)
    case SORT_BY_VALUES.AuthorAscending:
      return collator.compare(a.author, b.author)
    case SORT_BY_VALUES.AuthorDescending:
      return collator.compare(b.author, a.author)
    default:
      console.error(`Unknown sortOrder: ${sortOrder}`)
      return 0
  }
}
