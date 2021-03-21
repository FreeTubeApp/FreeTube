import $ from 'jquery'

const state = {}
const getters = {}

const actions = {
  sponsorBlockSkipSegments ({ rootState }, { videoId, categories }) {
    return new Promise((resolve, reject) => {
      const requestUrl = `${rootState.settings.sponsorBlockUrl}skipSegments?videoID=${videoId}&categories=${JSON.stringify(categories)}`

      $.getJSON(requestUrl, (response) => {
        resolve(response)
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
