const state = {}
const getters = {}

const actions = {
  sponsorBlockSkipSegments ({ rootState }, { videoId, categories }) {
    return new Promise((resolve, reject) => {
      const videoIdBuffer = new TextEncoder().encode(videoId)

      crypto.subtle.digest('SHA-256', videoIdBuffer).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer))

        const videoIdHashPrefix = hashArray
          .map(byte => byte.toString(16).padStart(2, '0'))
          .slice(0, 4)
          .join('')

        const requestUrl = `${rootState.settings.sponsorBlockUrl}/api/skipSegments/${videoIdHashPrefix}?categories=${JSON.stringify(categories)}`

        fetch(requestUrl)
          .then((response) => {
            // 404 means that there are no segments registered for the video
            if (response.status === 404) {
              resolve([])
              return
            }

            response.json()
              .then((json) => {
                const segments = json
                  .filter((result) => result.videoID === videoId)
                  .flatMap((result) => result.segments)
                resolve(segments)
              })
              .catch((error) => {
                console.error('failed to fetch SponsorBlock segments', requestUrl, error)
                reject(error)
              })
          })
          .catch((error) => {
            console.error('failed to fetch SponsorBlock segments', requestUrl, error)
            reject(error)
          })
      })
    })
  }
}

const mutations = {}

export default {
  state,
  getters,
  actions,
  mutations
}
