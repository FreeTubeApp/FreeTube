import $ from 'jquery'

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

        $.getJSON(requestUrl, (response) => {
          const segments = response
            .filter((result) => result.videoID === videoId)
            .flatMap((result) => result.segments)
          resolve(segments)
        }).fail((xhr, textStatus, error) => {
          // 404 means that there are no segments registered for the video
          if (xhr.status === 404) {
            resolve([])
            return
          }

          console.log(xhr)
          console.log(textStatus)
          console.log(requestUrl)
          console.error(error)
          reject(xhr)
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
