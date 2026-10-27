const YOUTUBE_REDIRECT_HOSTS = ['youtube.com', 'www.youtube.com']

/**
 * @param {URL} url
 * @returns {string|null|undefined} The q value, null when missing, or undefined for a non-redirect URL.
 */
export function getYouTubeRedirectTarget(url) {
  if (!YOUTUBE_REDIRECT_HOSTS.includes(url.hostname) || url.pathname !== '/redirect') {
    return undefined
  }

  return url.searchParams.get('q')
}
