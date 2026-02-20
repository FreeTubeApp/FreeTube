/**
 * fixes shaka-player referencing the Roboto font on google fonts in its CSS
 * by updating the CSS to point to the local Roboto font
 * @param {string} source
 */
module.exports = function (source) {
  return source.replace(/@font-face{font-family:Roboto;[^}]+}/, '')
}
