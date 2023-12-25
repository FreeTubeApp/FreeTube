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

export function isUrl(_string) {
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)*([\w-]+\.[A-Za-z]{2,})(\/[^#/?]+)*\/?(\?[^#]*)?(#.*)?$/gm
  return !!urlPattern.test(_string)
}
