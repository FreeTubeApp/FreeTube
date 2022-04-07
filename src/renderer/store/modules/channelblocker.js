import { ipcRenderer } from 'electron'
import { IpcChannels } from '../../../constants'

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
    const ls = localStorage.getItem('channelBlockerTempUnblock')
    try {
      const arr = JSON.parse(ls)
      if (arr instanceof Array) {
        commit('setTempUnblockSet', arr)
      } else {
        throw new Error()
      }
    } catch {
      commit('clearTempUnblockSet')
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
  setTempUnblockSet(state, arr) {
    state.channelBlockerTempUnblockIdSet = new Set(arr)
    state.channelBlockerTempUnblockIdArray = Array.from(state.channelBlockerTempUnblockIdSet)
    localStorage.setItem('channelBlockerTempUnblock', JSON.stringify(arr))
  },

  syncTempUnblockSet(state) {
    const ls = localStorage.getItem('channelBlockerTempUnblock')
    try {
      const arr = JSON.parse(ls)
      if (arr instanceof Array) {
        state.channelBlockerTempUnblockIdSet = new Set(arr)
        state.channelBlockerTempUnblockIdArray = Array.from(state.channelBlockerTempUnblockIdSet)
      } else {
        throw new Error()
      }
    } catch {
      console.error('Could not parse:', ls)
    }
  },

  upsertToTempUnblockSet(state, id) {
    state.channelBlockerTempUnblockIdSet.add(id)
    state.channelBlockerTempUnblockIdArray = Array.from(state.channelBlockerTempUnblockIdSet)
    localStorage.setItem('channelBlockerTempUnblock', JSON.stringify(state.channelBlockerTempUnblockIdArray))
    ipcRenderer.send(IpcChannels.SYNC_CHANNELBLOCKER)
  },

  deleteFromTempUnblockSet(state, id) {
    state.channelBlockerTempUnblockIdSet.delete(id)
    state.channelBlockerTempUnblockIdArray = Array.from(state.channelBlockerTempUnblockIdSet)
    localStorage.setItem('channelBlockerTempUnblock', JSON.stringify(state.channelBlockerTempUnblockIdArray))
    ipcRenderer.send(IpcChannels.SYNC_CHANNELBLOCKER)
  },

  clearTempUnblockSet(state) {
    state.channelBlockerTempUnblockIdSet.clear()
    state.channelBlockerTempUnblockIdArray = []
    localStorage.setItem('channelBlockerTempUnblock', JSON.stringify([]))
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
