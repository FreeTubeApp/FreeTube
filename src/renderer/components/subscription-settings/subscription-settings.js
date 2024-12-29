import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSlider from '../ft-slider/ft-slider.vue'

export default defineComponent({
  name: 'SubscriptionSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider,
  },
  computed: {
    hideWatchedSubs: function () {
      return this.$store.getters.getHideWatchedSubs
    },
    onlyShowLatestFromChannel: function () {
      return this.$store.getters.getOnlyShowLatestFromChannel
    },
    onlyShowLatestFromChannelNumber: function () {
      return this.$store.getters.getOnlyShowLatestFromChannelNumber
    },
    useRssFeeds: function () {
      return this.$store.getters.getUseRssFeeds
    },
    fetchSubscriptionsAutomatically: function () {
      return this.$store.getters.getFetchSubscriptionsAutomatically
    },
    unsubscriptionPopupStatus: function () {
      return this.$store.getters.getUnsubscriptionPopupStatus
    }
  },
  methods: {
    ...mapActions([
      'updateHideWatchedSubs',
      'updateUseRssFeeds',
      'updateFetchSubscriptionsAutomatically',
      'updateOnlyShowLatestFromChannel',
      'updateOnlyShowLatestFromChannelNumber',
      'updateUnsubscriptionPopupStatus'
    ])
  }
})
