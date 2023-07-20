import { defineComponent } from 'vue'

import SubscriptionsVideos from '../../components/subscriptions-videos/subscriptions-videos.vue'
import SubscriptionsLive from '../../components/subscriptions-live/subscriptions-live.vue'
import SubscriptionsShorts from '../../components/subscriptions-shorts/subscriptions-shorts.vue'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'

export default defineComponent({
  name: 'Subscriptions',
  components: {
    'subscriptions-videos': SubscriptionsVideos,
    'subscriptions-live': SubscriptionsLive,
    'subscriptions-shorts': SubscriptionsShorts,
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
      if (lastCurrentTabId !== null) { this.changeTab(lastCurrentTabId) }
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
        this.currentTab = null
      }
    },

    /**
     * @param {KeyboardEvent} event
     * @param {string} tab
     */
    focusTab: function (event, tab) {
      if (!event.altKey) {
        event.preventDefault()
        this.$refs[tab].focus()
        this.$emit('showOutlines')
      }
    }
  }
})
