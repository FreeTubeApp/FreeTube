import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInput from '../ft-input/ft-input.vue'

export default defineComponent({
  name: 'SubscriptionSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input': FtInput,
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
