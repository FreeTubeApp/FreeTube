import Vue from 'vue'
import { mapActions } from 'vuex'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'SubscriptionSettings',
  components: {
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      title: 'Subscription Settings'
    }
  },
  computed: {
    hideWatchedSubs: function () {
      return this.$store.getters.getHideWatchedSubs
    },
    useRssFeeds: function () {
      return this.$store.getters.getUseRssFeeds
    }
  },
  methods: {
    ...mapActions([
      'updateHideWatchedSubs',
      'updateUseRssFeeds'
    ])
  }
})
