import ky from 'ky/umd'
import param from 'jquery-param'

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
    return ky(
      `${rootState.settings.invidiousInstance}/api/v1/${payload.resource}/${payload.id}?${param(payload.params)}`
    ).json()
  },

  invidiousGetChannelInfo ({ commit, dispatch }, channelId) {
    commit('toggleIsGetChannelInfoRunning')

    return dispatch('invidiousAPICall', {
      resource: 'channels',
      id: channelId,
      params: {}
    })
      .then(json => {
        commit('toggleIsGetChannelInfoRunning')
        return json
      })
      .catch(error => {
        console.log('found an error')
        console.log(error)
        commit('toggleIsGetChannelInfoRunning')
        throw error
      })
  },

  invidiousGetPlaylistInfo ({ commit, dispatch }, payload) {
    return dispatch('invidiousAPICall', payload)
      .then(json => {
        commit('toggleIsGetChannelInfoRunning')
        return json
      })
      .catch(error => {
        console.log('found an error')
        console.log(error)
        commit('toggleIsGetChannelInfoRunning')
        throw error
      })
  },

  invidiousGetVideoInformation ({ dispatch }, videoId) {
    return dispatch('invidiousAPICall', {
      resource: 'videos',
      id: videoId,
      params: {}
    }).catch(error => {
      console.log('found an error')
      console.log(error)
      throw error
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
