import store from '../store/index'

export async function sponsorBlockSkipSegments(videoId, categories) {
  const videoIdBuffer = new TextEncoder().encode(videoId)

  const hashBuffer = await crypto.subtle.digest('SHA-256', videoIdBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  const videoIdHashPrefix = hashArray
    .map(byte => byte.toString(16).padStart(2, '0'))
    .slice(0, 4)
    .join('')

  const requestUrl = `${store.getters.getSponsorBlockUrl}/api/skipSegments/${videoIdHashPrefix}?categories=${JSON.stringify(categories)}`

  try {
    const response = await fetch(requestUrl)

    // 404 means that there are no segments registered for the video
    if (response.status === 404) {
      return []
    }

    const json = await response.json()
    return json
      .filter((result) => result.videoID === videoId)
      .flatMap((result) => result.segments)
  } catch (error) {
    console.error('failed to fetch SponsorBlock segments', requestUrl, error)
    throw error
  }
}
