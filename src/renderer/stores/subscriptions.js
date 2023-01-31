import { defineStore } from 'pinia'
import { MAIN_PROFILE_ID } from '../../../constants'

export const useSubscriptionsStore = defineStore('subscriptions', {
  state: () => {
    return {
      allSubscriptionsList: [],
      profileSubscriptions: {
        activeProfile: MAIN_PROFILE_ID,
        videoList: [],
        errorChannels: []
      }
    }
  },
  actions: {
    updateAllSubscriptionsList (subscriptions) {
      this.allSubscriptionsList = subscriptions
    },
    updateProfileSubscriptions (subscriptions) {
      this.profileSubscriptions = subscriptions
    },
  }
})
