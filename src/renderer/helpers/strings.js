/**
 * This will return true if a string is null, undefined or empty.
 * @param {string|null|undefined} _string the string to process
 * @returns {boolean} whether the string is empty or not
 */
export function isNullOrEmpty(_string) {
  return _string == null || _string === ''
}

/**
 * Is KeyboardEvent.key a printable char
 * @param {string} eventKey the string from KeyboardEvent.key to process
 * @returns {boolean} whether the string from KeyboardEvent.key is a printable char or not
 */
export function isKeyboardEventKeyPrintableChar(eventKey) {
  // Most printable chars are all strings with length 1 (except Unicode)
  // https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
  // https://www.w3.org/TR/DOM-Level-3-Events-key/
  if (eventKey.length === 1) { return true }
  // Emoji
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape
  if (/\p{Emoji_Presentation}/u.test(eventKey)) { return true }

  return false
}

export function translateWindowTitle(title, i18n) {
  switch (title) {
    case 'Subscriptions':
      return i18n.t('Subscriptions.Subscriptions')
    case 'Channels':
      return i18n.t('Channels.Title')
    case 'Trending':
      return i18n.t('Trending.Trending')
    case 'Most Popular':
      return i18n.t('Most Popular')
    case 'Your Playlists':
      return i18n.t('User Playlists.Your Playlists')
    case 'History':
      return i18n.t('History.History')
    case 'Settings':
      return i18n.t('Settings.Settings')
    case 'About':
      return i18n.t('About.About')
    case 'Profile Settings':
      return i18n.t('Profile.Profile Settings')
    case 'Search Results':
      return i18n.t('Search Filters.Search Results')
    case 'Playlist':
      return i18n.t('Playlist.Playlist')
    default:
      return null
  }
}
