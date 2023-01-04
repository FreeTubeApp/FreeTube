import fs from 'fs/promises'
import { pathExists } from '../../helpers/filesystem'

const state = {
  currentInvidiousInstance: '',
  invidiousInstancesList: null
}

const getters = {
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

    let instances = []
    try {
      const response = await fetch(requestUrl)
      const json = await response.json()
      instances = json.filter((instance) => {
        if (instance[0].includes('.onion') || instance[0].includes('.i2p') || !instance[1].api || (!process.env.IS_ELECTRON && !instance[1].cors)) {
          return false
        } else {
          return true
        }
      }).map((instance) => {
        return instance[1].uri.replace(/\/$/, '')
      })
    } catch (err) {
      console.error(err)
    }
    // If the invidious instance fetch isn't returning anything interpretable
    if (instances.length === 0) {
      // Starts fallback strategy: read from static file
      // And fallback to hardcoded entry(s) if static file absent
      const fileName = 'invidious-instances.json'
      /* eslint-disable-next-line */
      const fileLocation = process.env.NODE_ENV === 'development' ? './static/' : `${__dirname}/static/`
      if (await pathExists(`${fileLocation}${fileName}`)) {
        console.warn('reading static file for invidious instances')
        const fileData = await fs.readFile(`${fileLocation}${fileName}`)
        instances = JSON.parse(fileData).map((entry) => {
          return entry.url
        })
      } else {
        console.error('unable to read static file for invidious instances')
        instances = [
          'https://invidious.sethforprivacy.com',
          'https://invidious.namazso.eu'
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
      const requestUrl = state.currentInvidiousInstance + '/api/v1/' + payload.resource + '/' + payload.id + '?' + new URLSearchParams(payload.params).toString()

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
      const payload = {
        resource: 'channels',
        id: channelId,
        params: {}
      }

      dispatch('invidiousAPICall', payload).then((response) => {
        resolve(response)
      }).catch((xhr) => {
        console.error(xhr)
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
