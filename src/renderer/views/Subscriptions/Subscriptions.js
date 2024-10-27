import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

import SubscriptionsVideos from '../../components/subscriptions-videos/subscriptions-videos.vue'
import SubscriptionsLive from '../../components/subscriptions-live/subscriptions-live.vue'
import SubscriptionsShorts from '../../components/subscriptions-shorts/subscriptions-shorts.vue'
import SubscriptionsCommunity from '../../components/subscriptions-community/subscriptions-community.vue'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'

export default defineComponent({
  name: 'Subscriptions',
  components: {
    'subscriptions-videos': SubscriptionsVideos,
    'subscriptions-live': SubscriptionsLive,
    'subscriptions-shorts': SubscriptionsShorts,
    'subscriptions-community': SubscriptionsCommunity,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      currentTab: 'videos'
    }
  },
  computed: {
    hideSubscriptionsVideos: function () {
      return this.$store.getters.getHideSubscriptionsVideos
    },
    hideSubscriptionsShorts: function () {
      return this.$store.getters.getHideSubscriptionsShorts
    },
    hideSubscriptionsLive: function () {
      return this.$store.getters.getHideLiveStreams || this.$store.getters.getHideSubscriptionsLive
    },
    hideSubscriptionsCommunity: function() {
      return this.$store.getters.getHideSubscriptionsCommunity
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    activeSubscriptionList: function () {
      return this.activeProfile.subscriptions
    },
    useRssFeeds: function () {
      return this.$store.getters.getUseRssFeeds
    },

    visibleTabs: function () {
      const tabs = []

      if (!this.hideSubscriptionsVideos) {
        tabs.push('videos')
      }

      if (!this.hideSubscriptionsShorts) {
        tabs.push('shorts')
      }

      if (!this.hideSubscriptionsLive) {
        tabs.push('live')
      }

      // community does not support rss
      if (!this.hideSubscriptionsCommunity && !this.useRssFeeds && this.activeSubscriptionList.length < 125) {
        tabs.push('community')
      }

      return tabs
    }
  },
  watch: {
    currentTab(value) {
      if (value !== null) {
        // Save last used tab, restore when view mounted again
        sessionStorage.setItem('Subscriptions/currentTab', value)
      } else {
        sessionStorage.removeItem('Subscriptions/currentTab')
      }
    },
    /**
     * @param {string[]} newValue
     */
    visibleTabs: function (newValue) {
      if (newValue.length === 0) {
        this.currentTab = null
      } else if (!newValue.includes(this.currentTab)) {
        this.currentTab = newValue[0]
      }
    }
  },
  created: async function () {
    if (this.visibleTabs.length === 0) {
      this.currentTab = null
    } else {
      // Restore currentTab
      const lastCurrentTabId = sessionStorage.getItem('Subscriptions/currentTab')
      if (lastCurrentTabId !== null) {
        this.changeTab(lastCurrentTabId)
      } else if (!this.visibleTabs.includes(this.currentTab)) {
        this.currentTab = this.visibleTabs[0]
      }
    }
  },
  methods: {
    changeTab: function (tab) {
      if (tab === this.currentTab) {
        return
      }

      if (this.visibleTabs.includes(tab)) {
        this.currentTab = tab
      } else {
        // First visible tab or no tab
        this.currentTab = this.visibleTabs.length > 0 ? this.visibleTabs[0] : null
      }
    },

    /**
     * @param {KeyboardEvent} event
     * @param {string} currentTab
     */
    focusTab: function (event, currentTab) {
      if (!event.altKey) {
        event.preventDefault()

        const visibleTabs = this.visibleTabs

        if (visibleTabs.length === 1) {
          this.showOutlines()
          return
        }

        let index = visibleTabs.indexOf(currentTab)

        if (event.key === 'ArrowLeft') {
          index--
        } else {
          index++
        }

        if (index < 0) {
          index = visibleTabs.length - 1
        } else if (index > visibleTabs.length - 1) {
          index = 0
        }

        this.$refs[visibleTabs[index]].focus()
        this.showOutlines()
      }
    },

    ...mapActions([
      'showOutlines'
    ])
  }
})
