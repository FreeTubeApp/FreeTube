import fs from 'fs/promises'
import { pathExists } from '../../helpers/filesystem'
import { fetchWithTimeout } from '../../helpers/utils'

const state = {
  currentPipedInstance: '',
  pipedInstancesList: null
}

const getters = {
  getCurrentPipedInstance(state) {
    return state.currentPipedInstance
  },

  getPipedInstancesList(state) {
    return state.pipedInstancesList
  }
}

const actions = {
  async fetchPipedInstances({ commit }) {
    const requestUrl = 'https://piped-instances.kavin.rocks/'

    let instances = []
    try {
      const response = await (await fetchWithTimeout(15_000, requestUrl)).json()
      instances = response.map(instance => instance.api_url)
    } catch (err) {
      console.error(err)
    }
    // If the piped instance fetch isn't returning anything interpretable
    if (instances.length === 0) {
      // Fallback: read from static file
      const fileName = 'piped-instances.json'
      /* eslint-disable-next-line n/no-path-concat */
      const fileLocation = process.env.NODE_ENV === 'development' ? './static/' : `${__dirname}/static/`
      if (await pathExists(`${fileLocation}${fileName}`)) {
        console.warn('reading static file for piped instances')
        const fileData = await fs.readFile(`${fileLocation}${fileName}`)
        instances = JSON.parse(fileData)
      }
    }
    commit('setPipedInstancesList', instances)
  },

  setRandomCurrentPipedInstance({ commit, state }) {
    const instanceList = state.pipedInstancesList
    const randomIndex = Math.floor(Math.random() * instanceList.length)
    commit('setCurrentPipedInstance', instanceList[randomIndex])
  }
}

const mutations = {
  setCurrentPipedInstance(state, value) {
    state.currentPipedInstance = value
  },

  setPipedInstancesList(state, value) {
    state.pipedInstancesList = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
