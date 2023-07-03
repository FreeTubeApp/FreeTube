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
  methods: {
    changeTab: function (tab) {
      if (tab === this.currentTab) {
        return
      }

      this.currentTab = tab
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
