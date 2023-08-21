export function sanitizeForHtmlId(attribute) {
  return attribute.replaceAll(/\s+/g, '')
}
