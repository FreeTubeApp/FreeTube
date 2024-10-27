/**
 * electron-context-menu only needs mime-db for its save as feature.
 * As we only activate save image and save as image features, we can remove all other mimetypes,
 * as they will never get used.
 * Which results in quite a significant reduction in file size.
 * @param {string} source
 */
module.exports = function (source) {
  const original = JSON.parse(source)

  const reduced = {}

  for (const mimeType of Object.keys(original)) {
    if (mimeType.startsWith('image/') && original[mimeType].extensions &&
      (!mimeType.startsWith('image/x-') || mimeType === 'image/x-icon' || mimeType === 'image/x-ms-bmp') &&
      (!mimeType.startsWith('image/vnd.') || mimeType === 'image/vnd.microsoft.icon')) {
      // Only the extensions field is needed, see: https://github.com/kevva/ext-list/blob/v2.2.2/index.js
      reduced[mimeType] = {
        extensions: original[mimeType].extensions
      }
    }
  }

  return JSON.stringify(reduced)
}
