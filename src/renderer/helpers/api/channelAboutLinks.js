const YOUTUBE_REDIRECT_HOSTS = ['youtube.com', 'www.youtube.com']

function getDirectUrl(endpoint) {
  try {
    let url = new URL(endpoint.toURL())

    if (YOUTUBE_REDIRECT_HOSTS.includes(url.hostname) && url.pathname === '/redirect') {
      url = new URL(url.searchParams.get('q'))
    }

    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export function parseLocalChannelAboutLinks(about) {
  const links = about.primary_links ?? about.metadata.links
  const parsedLinks = []

  for (const link of links) {
    const endpoint = link.endpoint ?? link.link.endpoint
    const url = getDirectUrl(endpoint)

    if (!url) {
      continue
    }

    const title = link.title.toString().trim()

    parsedLinks.push({
      title: title || url,
      url,
      displayUrl: url.replace(/^https:\/\//, '')
    })
  }

  return parsedLinks
}
