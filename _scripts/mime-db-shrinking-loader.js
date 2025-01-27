/**
 * electron-context-menu only needs mime-db for its save as feature.
 * As we only activate save image and save as image features, we can remove all other mimetypes,
 * as they will never get used.
 * Which results in quite a significant reduction in file size.
 * @param {string} source
 */
module.exports = function (source) {
  const original = JSON.parse(source)

  // Only the extensions field is needed, see: https://github.com/kevva/ext-list/blob/v2.2.2/index.js

  return JSON.stringify({
    'image/apng': { extensions: original['image/apng'].extensions },
    'image/avif': { extensions: original['image/avif'].extensions },
    'image/gif': { extensions: original['image/gif'].extensions },
    'image/jpeg': { extensions: original['image/jpeg'].extensions },
    'image/png': { extensions: original['image/png'].extensions },
    'image/svg+xml': { extensions: original['image/svg+xml'].extensions },
    'image/webp': { extensions: original['image/webp'].extensions }
  })
}
