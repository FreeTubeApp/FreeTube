const state = {
  channelBlockerTempUnblockIdSet: new Set(),
  channelBlockerTempUnblockIdArray: []
}

const getters = {
  getChannelBlockerTempUnblockIdArray(state) {
    return state.channelBlockerTempUnblockIdArray
  }
}

const actions = {
  grabChannelBlockerTempUnblockId({ commit }) {
    const ss = sessionStorage.getItem('channelBlockerTempUnblock')
    if (!ss) {
      commit('createTempUnblockSet')
    } else {
      commit('setTempUnblockSet', JSON.parse(ss))
    }
  },

  addChannelBlockerTempUnblockId({ commit }, id) {
    commit('upsertToTempUnblockSet', id)
  },

  deleteChannelBlockerTempUnblockId({ commit }, id) {
    commit('deleteFromTempUnblockSet', id)
  },

  clearChannelBlockerTempUnblockId({ commit }) {
    commit('clearTempUnblockSet')
  }
}

const mutations = {
  createTempUnblockSet(state) {
    sessionStorage.setItem('channelBlockerTempUnblock', JSON.stringify([]))
  },

  setTempUnblockSet(state, arr) {
    state.channelBlockerTempUnblockIdSet = new Set(arr)
    state.channelBlockerTempUnblockIdArray = Array.from(state.channelBlockerTempUnblockIdSet)
    sessionStorage.setItem('channelBlockerTempUnblock', JSON.stringify(arr))
  },

  upsertToTempUnblockSet(state, id) {
    state.channelBlockerTempUnblockIdSet.add(id)
    state.channelBlockerTempUnblockIdArray = Array.from(state.channelBlockerTempUnblockIdSet)
    sessionStorage.setItem('channelBlockerTempUnblock', JSON.stringify(state.channelBlockerTempUnblockIdArray))
  },

  deleteFromTempUnblockSet(state, id) {
    state.channelBlockerTempUnblockIdSet.delete(id)
    state.channelBlockerTempUnblockIdArray = Array.from(state.channelBlockerTempUnblockIdSet)
    sessionStorage.setItem('channelBlockerTempUnblock', JSON.stringify(state.channelBlockerTempUnblockIdArray))
  },

  clearTempUnblockSet(state) {
    if (state.channelBlockerTempUnblockIdSet) {
      state.channelBlockerTempUnblockIdSet.clear()
    }
    state.channelBlockerTempUnblockIdArray = []
    sessionStorage.setItem('channelBlockerTempUnblock', JSON.stringify([]))
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
