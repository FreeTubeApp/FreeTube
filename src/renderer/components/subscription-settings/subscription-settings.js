import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

export default defineComponent({
  name: 'SubscriptionSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch
  },
  computed: {
    hideWatchedSubs: function () {
      return this.$store.getters.getHideWatchedSubs
    },
    onlyShowLatestFromChannel: function () {
      return this.$store.getters.getOnlyShowLatestFromChannel
    },
    useRssFeeds: function () {
      return this.$store.getters.getUseRssFeeds
    },
    fetchSubscriptionsAutomatically: function () {
      return this.$store.getters.getFetchSubscriptionsAutomatically
    }
  },
  methods: {
    ...mapActions([
      'updateHideWatchedSubs',
      'updateUseRssFeeds',
      'updateFetchSubscriptionsAutomatically',
      'updateOnlyShowLatestFromChannel'
    ])
  }
})
