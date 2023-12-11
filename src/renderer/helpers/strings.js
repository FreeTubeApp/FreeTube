import i18n from '../i18n/index'

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

export function translateWindowTitle(path) {
  switch (path) {
    case '/settings':
      return i18n.t('Settings.Settings')
    case 'default':
    case 'subscriptions':
      return i18n.t('Subscriptions.Subscriptions')
    case 'subscribedChannels':
      return i18n.t('Channels.Title')
    case 'trending':
      return i18n.t('Trending.Trending')
    case 'popular':
      return i18n.t('Most Popular')
    case 'userPlaylists':
      return i18n.t('User Playlists.Your Playlists')
    case 'history':
      return i18n.t('History.History')
    case 'settings':
      return i18n.t('Settings.Settings')
    case 'about':
      return i18n.t('About.About')
    case 'profileSettings':
      return i18n.t('Profile.Profile Settings')
    case 'search':
      return i18n.t('Search Filters.Search Results')
    case 'playlist':
      return i18n.t('Playlist.Playlist')
    default:
      return null
  }
}
