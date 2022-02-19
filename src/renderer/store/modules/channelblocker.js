import { DBChannelBlockerHandlers } from '../../../datastores/handlers/index'
import FtListVideoChannelBlockerEvents from '../../components/ft-list-video/ft-list-video-channel-blocker-event.js'

const state = {
  channelBlockerCache: [], // array of {_id, name}
  searchChannelBlockerCache: [] // same
}

const getters = {
  getChannelBlockerCache: () => {
    return state.channelBlockerCache
  },

  getSearchChannelBlockerCache: () => {
    return state.searchChannelBlockerCache
  }
}

const actions = {
  async grabBlockedChannels({ commit }) {
    try {
      const results = await DBChannelBlockerHandlers.find({})
      commit('setChannelBlockerCache', results)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async channelBlockerAddChannel ({ commit }, channel) {
    try {
      commit('upsertToChannelBlockerCache', channel)
      await DBChannelBlockerHandlers.upsert(channel)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async channelBlockerRemoveChannelById ({ commit }, channelId) {
    try {
      commit('removeFromChannelBlockerCacheById', channelId)
      await DBChannelBlockerHandlers.delete(channelId)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async channelBlockerIsBlockedById ({ commit }, channelId) {
    try {
      const results = await DBChannelBlockerHandlers.find({ _id: channelId })
      if (results.length > 0) {
        return true
      }
      return false
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async searchBlockedChannels({ commit }, query) {
    try {
      const results = await DBChannelBlockerHandlers.find({ name: { $regex: new RegExp(query, 'i') } })
      commit('setSearchChannelBlockerCache', results)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  compactBlockedChannels(_) {
    DBChannelBlockerHandlers.persist()
  }
}

const mutations = {
  setChannelBlockerCache(state, channelBlockerCache) {
    state.channelBlockerCache = channelBlockerCache.sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  },

  setSearchChannelBlockerCache(state, result) {
    state.searchChannelBlockerCache = result
  },

  upsertToChannelBlockerCache(state, channel) {
    state.channelBlockerCache.findIndex((blockedChannel) => {
      return channel._id === blockedChannel._id
    })

    // sort() by name doesn't work so manually inserting
    const nameLocaleUpper = channel.name.toLocaleUpperCase()
    for (let i = 0; i < state.channelBlockerCache.length; i++) {
      if (state.channelBlockerCache[i].name.toLocaleUpperCase() > nameLocaleUpper) {
        state.channelBlockerCache.splice(i, 0, channel)
        FtListVideoChannelBlockerEvents.$emit('cbUpdateChannel', channel._id)
        return
      }
    }
    state.channelBlockerCache.push(channel)
    FtListVideoChannelBlockerEvents.$emit('cbUpdateChannel', channel._id)
  },

  removeFromChannelBlockerCacheById(state, channelId) {
    for (let i = state.channelBlockerCache.length - 1; i >= 0; i--) {
      if (state.channelBlockerCache[i]._id === channelId) {
        state.channelBlockerCache.splice(i, 1)
        break
      }
    }

    if (state.searchChannelBlockerCache.length > 0) {
      for (let i = state.searchChannelBlockerCache.length - 1; i >= 0; i--) {
        if (state.searchChannelBlockerCache[i]._id === channelId) {
          state.searchChannelBlockerCache.splice(i, 1)
          break
        }
      }
    }

    FtListVideoChannelBlockerEvents.$emit('cbUpdateChannel', channelId)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
