import $ from 'jquery'
import forge from 'node-forge'

const state = {}
const getters = {}

const actions = {
  sponsorBlockSkipSegments ({ rootState }, { videoId, categories }) {
    return new Promise((resolve, reject) => {
      const messageDigestSha256 = forge.md.sha256.create()
      messageDigestSha256.update(videoId)
      const videoIdHashPrefix = messageDigestSha256.digest().toHex().substring(0, 4)
      const requestUrl = `${rootState.settings.sponsorBlockUrl}skipSegments/${videoIdHashPrefix}?categories=${JSON.stringify(categories)}`

      $.getJSON(requestUrl, (response) => {
        const segments = response
          .filter((result) => result.videoID === videoId)
          .flatMap((result) => result.segments)
        resolve(segments)
      }).fail((xhr, textStatus, error) => {
        console.log(xhr)
        console.log(textStatus)
        console.log(requestUrl)
        console.log(error)
        reject(xhr)
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
