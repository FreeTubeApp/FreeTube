import { historyDb } from '../datastores'

const state = {
  historyCache: []
}

const getters = {
  getHistoryCache: () => {
    return state.historyCache
  }
}

const actions = {
  grabHistory ({ commit }) {
    historyDb.find({}).sort({
      timeWatched: -1
    }).exec((err, results) => {
      if (err) {
        console.log(err)
        return
      }
      commit('setHistoryCache', results)
    })
  },

  updateHistory ({ dispatch }, videoData) {
    historyDb.update({ videoId: videoData.videoId }, videoData, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabHistory')
      }
    })
  },

  removeFromHistory ({ dispatch }, videoId) {
    historyDb.remove({ videoId: videoId }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabHistory')
      }
    })
  },

  removeAllHistory ({ dispatch }) {
    historyDb.remove({}, { multi: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabHistory')
      }
    })
  },

  updateWatchProgress ({ dispatch }, videoData) {
    historyDb.update({ videoId: videoData.videoId }, { $set: { watchProgress: videoData.watchProgress } }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabHistory')
      }
    })
  },

  compactHistory (_) {
    historyDb.persistence.compactDatafile()
  }
}

const mutations = {
  setHistoryCache (state, historyCache) {
    state.historyCache = historyCache
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
