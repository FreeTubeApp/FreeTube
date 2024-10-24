import { createWebURL, fetchWithTimeout } from '../../helpers/utils'

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
  async fetchPipedInstancesFromFile({ commit }) {
    const url = createWebURL('/static/piped-instances.json')
    const instances = await (await fetch(url)).json()
    commit('setPipedInstancesList', instances)
  },

  async fetchPipedInstances({ commit }) {
    const requestUrl = 'https://piped-instances.kavin.rocks/'
    let instances = []
    try {
      const response = await fetchWithTimeout(15_000, requestUrl)
      const json = await response.json()
      instances = json.map(instance => instance.api_url)

      if (instances.length !== 0) {
        commit('setPipedInstancesList', instances)
      } else {
        console.warn('using static file for piped instances')
      }
    } catch (err) {
      if (err.name === 'TimeoutError') {
        console.error('Fetching the Piped instance list timed out after 15 seconds. Falling back to local copy.')
      } else {
        console.error(err)
      }
    }
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
