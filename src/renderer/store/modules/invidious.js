import $ from 'jquery'
import fs from 'fs'

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
  async fetchInvidiousInstances({ commit }, payload) {
    const requestUrl = 'https://api.invidious.io/instances.json'

    let instances = []
    try {
      const response = await fetch(requestUrl)
      const json = await response.json()
      instances = json.filter((instance) => {
        if (instance[0].includes('.onion') || instance[0].includes('.i2p')) {
          return false
        } else {
          return true
        }
      }).map((instance) => {
        return instance[1].uri.replace(/\/$/, '')
      })
    } catch (err) {
      console.error(err)
      // Starts fallback strategy: read from static file
      // And fallback to hardcoded entry(s) if static file absent
      const fileName = 'invidious-instances.json'
      /* eslint-disable-next-line */
      const fileLocation = payload.isDev ? './static/' : `${__dirname}/static/`
      if (fs.existsSync(`${fileLocation}${fileName}`)) {
        console.warn('reading static file for invidious instances')
        const fileData = fs.readFileSync(`${fileLocation}${fileName}`)
        instances = JSON.parse(fileData).map((entry) => {
          return entry.url
        })
      } else {
        console.error('unable to read static file for invidious instances')
        instances = [
          'https://invidious.snopyta.org',
          'https://invidious.kavin.rocks/'
        ]
      }
    }

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

      fetch(requestUrl)
        .then((response) => response.json())
        .then((json) => {
          resolve(json)
        })
        .catch((error) => {
          console.error('Invidious API error', requestUrl, error)
          reject(error)
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
        console.error(xhr)
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
        console.error(xhr)
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
        console.error(xhr)
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
