import { getYouTubeRedirectTarget } from './youtubeRedirect.js'

const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:']

/**
 * @param {import('youtubei.js').YTNodes.NavigationEndpoint} endpoint
 * @returns {string|null}
 */
function getDirectUrl(endpoint) {
  try {
    let url = new URL(endpoint.toURL())

    const redirectTarget = getYouTubeRedirectTarget(url)
    if (redirectTarget !== undefined) {
      url = new URL(redirectTarget)
    }

    return ALLOWED_LINK_PROTOCOLS.includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

/**
 * @param {import('youtubei.js').YTNodes.ChannelAboutFullMetadata | import('youtubei.js').YTNodes.AboutChannel} about
 * @returns {{ title: string, url: string, displayUrl: string, iconUrl: string }[]}
 */
export function parseLocalChannelAboutLinks(about) {
  const links = about.primary_links ?? about.metadata?.links ?? []
  const parsedLinks = []

  for (const link of links) {
    const endpoint = link.endpoint ?? link.link.endpoint
    const url = getDirectUrl(endpoint)

    if (!url) {
      continue
    }

    const icons = link.icon ?? link.favicon ?? []

    parsedLinks.push({
      title: link.title.text?.trim() ?? '',
      url,
      displayUrl: url.replace(/^https?:\/\/(?:www\.)?/, ''),
      iconUrl: icons[0]?.url ?? ''
    })
  }

  return parsedLinks
}
