const state = {
  allSubscriptionsList: [],
  profileSubscriptions: {
    activeProfile: 0,
    videoList: []
  }
}

const getters = {
  getAllSubscriptionsList: () => {
    return state.allSubscriptionsList
  },
  getProfileSubscriptions: () => {
    return state.profileSubscriptions
  }
}

const actions = {
  updateAllSubscriptionsList ({ commit }, subscriptions) {
    commit('setAllSubscriptionsList', subscriptions)
  },
  updateProfileSubscriptions ({ commit }, subscriptions) {
    commit('setProfileSubscriptions', subscriptions)
  }
}

const mutations = {
  setAllSubscriptionsList (state, allSubscriptionsList) {
    state.allSubscriptionsList = allSubscriptionsList
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
