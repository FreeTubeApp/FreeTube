import Vue from 'vue'
import { mapActions } from 'vuex'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import ChannelBlockerSettingsList from '../channel-blocker-settings-list/channel-blocker-settings-list.vue'

export default Vue.extend({
  name: 'ChannlBlockerSettings',
  components: {
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input': FtInput,
    'ft-flex-box': FtFlexBox,
    'channel-blocker-settings-list': ChannelBlockerSettingsList
  },
  data: function () {
    return {
      hasQuery: false
    }
  },
  computed: {
    useChannelBlocker: function () {
      return this.$store.getters.getUseChannelBlocker
    },

    channelBlockerCache: function () {
      if (!this.hasQuery) {
        return this.$store.getters.getChannelBlockerCache
      } else {
        return this.$store.getters.getSearchChannelBlockerCache
      }
    }
  },
  methods: {
    handleUpdateChannelBlocker: function (value) {
      this.updateUseChannelBlocker(value)
    },

    filterChannelsList: function (query) {
      this.hasQuery = query !== ''
      this.$store.dispatch('searchBlockedChannels', query)
    },

    removeChannelFromBlockList: function (_id) {
      this.channelBlockerRemoveChannelById(_id).then(_ => {
        this.compactBlockedChannels()
      }).catch(err => {
        console.error(err)
      })
    },

    ...mapActions([
      'updateUseChannelBlocker',
      'channelBlockerRemoveChannelById',
      'compactBlockedChannels'
    ])
  }
})
