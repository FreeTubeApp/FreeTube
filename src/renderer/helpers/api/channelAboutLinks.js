const YOUTUBE_REDIRECT_HOSTS = ['youtube.com', 'www.youtube.com']
const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:']

/**
 * @param {import('youtubei.js').YTNodes.NavigationEndpoint} endpoint
 * @returns {string|null}
 */
function getDirectUrl(endpoint) {
  try {
    let url = new URL(endpoint.toURL())

    if (YOUTUBE_REDIRECT_HOSTS.includes(url.hostname) && url.pathname === '/redirect') {
      url = new URL(url.searchParams.get('q'))
    }

    return ALLOWED_LINK_PROTOCOLS.includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

/**
 * @param {import('youtubei.js').YTNodes.ChannelAboutFullMetadata | import('youtubei.js').YTNodes.AboutChannel} about
 * @returns {{ title: string, url: string, displayUrl: string }[]}
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

    parsedLinks.push({
      title: link.title.toString(),
      url,
      displayUrl: url.replace(/^https?:\/\/(?:www\.)?/, '')
    })
  }

  return parsedLinks
}
