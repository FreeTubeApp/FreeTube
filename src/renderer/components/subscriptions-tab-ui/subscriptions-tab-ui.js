import { defineComponent } from 'vue'

import FtLoader from '../ft-loader/ft-loader.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtRefreshWidget from '../ft-refresh-widget/ft-refresh-widget.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtElementList from '../FtElementList/FtElementList.vue'
import FtChannelBubble from '../ft-channel-bubble/ft-channel-bubble.vue'
import FtAutoLoadNextPageWrapper from '../ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'

export default defineComponent({
  name: 'SubscriptionsTabUI',
  components: {
    'ft-loader': FtLoader,
    'ft-button': FtButton,
    'ft-refresh-widget': FtRefreshWidget,
    'ft-flex-box': FtFlexBox,
    'ft-element-list': FtElementList,
    'ft-channel-bubble': FtChannelBubble,
    'ft-auto-load-next-page-wrapper': FtAutoLoadNextPageWrapper,
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    videoList: {
      type: Array,
      default: () => ([])
    },
    isCommunity: {
      type: Boolean,
      default: false
    },
    errorChannels: {
      type: Array,
      default: () => ([])
    },
    attemptedFetch: {
      type: Boolean,
      default: false
    },
    initialDataLimit: {
      type: Number,
      default: 100
    },
    lastRefreshTimestamp: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  },
  emits: ['refresh'],
  data: function () {
    return {
      dataLimit: 100,
    }
  },
  computed: {
    activeVideoList: function () {
      if (this.videoList.length < this.dataLimit) {
        return this.videoList
      } else {
        return this.videoList.slice(0, this.dataLimit)
      }
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    activeSubscriptionList: function () {
      return this.activeProfile.subscriptions
    },

    fetchSubscriptionsAutomatically: function() {
      return this.$store.getters.getFetchSubscriptionsAutomatically
    }
  },
  created: function () {
    const dataLimit = sessionStorage.getItem('subscriptionLimit')

    if (dataLimit !== null) {
      this.dataLimit = dataLimit
    } else {
      this.dataLimit = this.initialDataLimit
    }
  },
  mounted: function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    increaseLimit: function () {
      this.dataLimit += this.initialDataLimit
      sessionStorage.setItem('subscriptionLimit', this.dataLimit)
    },

    /**
     * This function `keyboardShortcutHandler` should always be at the bottom of this file
     * @param {KeyboardEvent} event the keyboard event
     */
    keyboardShortcutHandler: function (event) {
      if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
        return
      }
      // Avoid handling events due to user holding a key (not released)
      // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
      if (event.repeat) { return }

      switch (event.key) {
        case 'r':
        case 'R':
        case 'F5':
          if (!this.isLoading && this.activeSubscriptionList.length > 0) {
            this.$emit('refresh')
          }
          break
      }
    },

    refresh: function() {
      this.$emit('refresh')
    }
  }
})
