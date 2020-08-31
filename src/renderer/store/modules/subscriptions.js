import ytch from 'yt-channel-info'

const state = {
  subscriptions: [],
  profileSubscriptions: {
    activeProfile: 0,
    videoList: []
  }
}

const getters = {
  getSubscriptions: () => {
    return state.subscriptions
  },
  getProfileSubscriptions: () => {
    return state.profileSubscriptions
  }
}

const actions = {
  updateSubscriptions ({ commit }, subscriptions) {
    commit('setSubscriptions', subscriptions)
  },
  updateProfileSubscriptions ({ commit }, subscriptions) {
    commit('setProfileSubscriptions', subscriptions)
  }
}

const mutations = {
  setSubscriptions (state, subscriptions) {
    state.subscriptions = subscriptions
  },
  setProfileSubscriptions (state, profileSubscriptions) {
    state.profileSubscriptions = profileSubscriptions
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
