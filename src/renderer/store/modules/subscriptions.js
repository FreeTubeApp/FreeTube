import { MAIN_PROFILE_ID } from '../../../constants'

const state = {
  allSubscriptionsList: [],
  profileSubscriptions: {
    activeProfile: MAIN_PROFILE_ID,
    videoList: [],
    errorChannels: []
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
