import $ from 'jquery'

const state = {
  currentInvidiousInstance: '',
  invidiousInstancesList: null,
  isGetChannelInfoRunning: false
}

const getters = {
  getIsGetChannelInfoRunning(state) {
    return state.isGetChannelInfoRunning
  },

  getCurrentInvidiousInstance(state) {
    return state.currentInvidiousInstance
  },

  getInvidiousInstancesList(state) {
    return state.invidiousInstancesList
  }
}

const actions = {
  async fetchInvidiousInstances({ commit }) {
    const requestUrl = 'https://api.invidious.io/instances.json'

    let response
    try {
      response = await $.getJSON(requestUrl)
    } catch (err) {
      console.log(err)
    }

    const instances = response.filter((instance) => {
      if (instance[0].includes('.onion') || instance[0].includes('.i2p') || instance[0].includes('yewtu.be')) {
        return false
      } else {
        return true
      }
    }).map((instance) => {
      return instance[1].uri.replace(/\/$/, '')
    })

    commit('setInvidiousInstancesList', instances)
  },

  setRandomCurrentInvidiousInstance({ commit, state }) {
    const instanceList = state.invidiousInstancesList
    const randomIndex = Math.floor(Math.random() * instanceList.length)
    commit('setCurrentInvidiousInstance', instanceList[randomIndex])
  },

  invidiousAPICall({ state }, payload) {
    return new Promise((resolve, reject) => {
      const requestUrl = state.currentInvidiousInstance + '/api/v1/' + payload.resource + '/' + payload.id + '?' + $.param(payload.params)

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

  invidiousGetChannelInfo({ commit, dispatch }, channelId) {
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

  invidiousGetPlaylistInfo({ commit, dispatch }, payload) {
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

  invidiousGetVideoInformation({ dispatch }, videoId) {
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
  toggleIsGetChannelInfoRunning(state) {
    state.isGetChannelInfoRunning = !state.isGetChannelInfoRunning
  },

  setCurrentInvidiousInstance(state, value) {
    state.currentInvidiousInstance = value
  },

  setInvidiousInstancesList(state, value) {
    state.invidiousInstancesList = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
