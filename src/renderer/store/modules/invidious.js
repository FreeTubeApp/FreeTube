import fs from 'fs/promises'
import { createWebURL, fetchWithTimeout } from '../../helpers/utils'

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
      const response = await fetchWithTimeout(15_000, requestUrl)
      const json = await response.json()
      instances = json.filter((instance) => {
        return !(instance[0].includes('.onion') ||
          instance[0].includes('.i2p') ||
          !instance[1].api ||
          (!process.env.SUPPORTS_LOCAL_API && !instance[1].cors))
      }).map((instance) => {
        return instance[1].uri.replace(/\/$/, '')
      })
    } catch (err) {
      if (err.name === 'TimeoutError') {
        console.error('Fetching the Invidious instance list timed out after 15 seconds. Falling back to local copy.')
      } else {
        console.error(err)
      }
    }

    // If the invidious instance fetch isn't returning anything interpretable
    if (instances.length === 0) {
      // Fallback: read from static file
      const fileName = 'invidious-instances.json'
      /* eslint-disable-next-line n/no-path-concat */
      const fileLocation = process.env.NODE_ENV === 'development' ? './static/' : `${__dirname}/static/`
      const filePath = `${fileLocation}${fileName}`
      console.warn('reading static file for invidious instances')
      const fileData = process.env.IS_ELECTRON ? await fs.readFile(filePath, 'utf8') : await (await fetch(createWebURL(filePath))).text()
      instances = JSON.parse(fileData).filter(e => {
        return process.env.SUPPORTS_LOCAL_API || e.cors
      }).map(e => {
        return e.url
      })
    }
    commit('setInvidiousInstancesList', instances)
  },

  setRandomCurrentInvidiousInstance({ commit, state }) {
    const instanceList = state.invidiousInstancesList
    const randomIndex = Math.floor(Math.random() * instanceList.length)
    commit('setCurrentInvidiousInstance', instanceList[randomIndex])
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
