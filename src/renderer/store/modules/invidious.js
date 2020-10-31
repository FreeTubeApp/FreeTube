import $ from 'jquery'

const state = {
  main: 0,
  isGetChannelInfoRunning: false
}

const getters = {
  getIsGetChannelInfoRunning ({ state }) {
    return state.isGetChannelInfoRunning
  }
}

const actions = {
  invidiousAPICall ({ rootState }, payload) {
    return new Promise((resolve, reject) => {
      const requestUrl = rootState.settings.invidiousInstance + '/api/v1/' + payload.resource + '/' + payload.id + '?' + $.param(payload.params)

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
  },

  invidiousGetChannelInfo ({ commit, dispatch }, channelId) {
    return new Promise((resolve, reject) => {
      commit('toggleIsGetChannelInfoRunning')

      const payload = {
        resource: 'channels',
        id: channelId,
        params: {}
      }

      dispatch('invidiousAPICall', payload).then((response) => {
        resolve(response)
      }).catch((xhr) => {
        console.log('found an error')
        console.log(xhr)
        commit('toggleIsGetChannelInfoRunning')
        reject(xhr)
      })
    })
  },

  invidiousGetPlaylistInfo ({ commit, dispatch }, payload) {
    return new Promise((resolve, reject) => {
      dispatch('invidiousAPICall', payload).then((response) => {
        resolve(response)
      }).catch((xhr) => {
        console.log('found an error')
        console.log(xhr)
        commit('toggleIsGetChannelInfoRunning')
        reject(xhr)
      })
    })
  },

  invidiousGetVideoInformation ({ dispatch }, videoId) {
    return new Promise((resolve, reject) => {
      const payload = {
        resource: 'videos',
        id: videoId,
        params: {}
      }

      dispatch('invidiousAPICall', payload).then((response) => {
        resolve(response)
      }).catch((xhr) => {
        console.log('found an error')
        console.log(xhr)
        reject(xhr)
      })
    })
  }
}

const mutations = {
  toggleIsGetChannelInfoRunning (state) {
    state.isGetChannelInfoRunning = !state.isGetChannelInfoRunning
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
