/**
 * @param {string} attribute
 * @returns {string}
 */
export function sanitizeForHtmlId(attribute) {
  return attribute.replaceAll(/\s+/g, '')
}
