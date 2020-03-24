import Datastore from 'nedb'
const localDataStorage = '/db'

const subDb = new Datastore({
  filename: localDataStorage + '/subscriptions.db',
  autoload: true
})

const state = {
  subscriptions: []
}

const mutations = {
  addSubscription (state, payload) {
    state.subscriptions.push(payload)
  },
  setSubscriptions (state, payload) {
    state.subscriptions = payload
  }
}

const actions = {
  addSubscriptions ({ commit }, payload) {
    subDb.insert(payload, (err, payload) => {
      if (!err) {
        commit('addSubscription', payload)
      }
    })
  },
  getSubscriptions ({ commit }, payload) {
    subDb.find({}, (err, payload) => {
      if (!err) {
        commit('setSubscriptions', payload)
      }
    })
  },
  removeSubscription ({ commit }, channelId) {
    subDb.remove({ channelId: channelId }, {}, () => {
      commit('setSubscriptions', this.state.subscriptions.filter(sub => sub.channelId !== channelId))
    })
  }
}
const getters = {}
export default {
  state,
  getters,
  actions,
  mutations
}
