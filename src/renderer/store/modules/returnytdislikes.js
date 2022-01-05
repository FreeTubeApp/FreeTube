
import $ from 'jquery'

const state = {}
const getters = {}

const actions = {
  // Dislike counter data taken from https://github.com/Anarios/return-youtube-dislike
  // see https://returnyoutubedislikeapi.com/swagger/index.html for api documentation
  ytGetDislikes ({ rootState }, videoId) {
    return new Promise((resolve, reject) => {
      const requestUrl = `https://returnyoutubedislikeapi.com/Votes?videoId=${videoId}`

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
