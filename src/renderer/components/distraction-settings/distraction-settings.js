import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import channelBlockerMixin from '../../mixins/channelblocker'

export default Vue.extend({
  name: 'PlayerSettings',
  components: {
    'ft-card': FtCard,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-button': FtButton,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-prompt': FtPrompt
  },
  mixins: [
    channelBlockerMixin
  ],
  data: function () {
    return {
      channelBlockerHasQuery: false,
      channelBlockerSearchResult: [],
      channelBlockerChannelToRemove: {},
      channelBlockerPromptText: '',
      showChannelBlockerRemovePrompt: false,
      channelBlockerTempUnblockPromptText: '',
      showChannelBlockerTempUnblockRemovePrompt: false,
      promptValues: [
        'yes',
        'no'
      ]
    }
  },
  computed: {
    hideVideoViews: function () {
      return this.$store.getters.getHideVideoViews
    },
    hideVideoLikesAndDislikes: function () {
      return this.$store.getters.getHideVideoLikesAndDislikes
    },
    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    },
    hideCommentLikes: function () {
      return this.$store.getters.getHideCommentLikes
    },
    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hidePlaylists: function () {
      return this.$store.getters.getHidePlaylists
    },
    hideLiveChat: function () {
      return this.$store.getters.getHideLiveChat
    },
    hideActiveSubscriptions: function () {
      return this.$store.getters.getHideActiveSubscriptions
    },
    channelBlockerSkipBlocked: function () {
      return this.$store.getters.getChannelBlockerSkipBlocked
    },
    channelBlockerAllowTempUnblock: function () {
      return this.$store.getters.getChannelBlockerAllowTempUnblock
    },
    channelBlockerShownList: function () {
      if (this.channelBlockerHasQuery) {
        return this.channelBlockerSearchResult
      } else {
        return this._channelBlockerList
      }
    },
    channelBlockerRemoveButtonTitle: function() {
      return this.$t('Settings.Distraction Free Settings.ChannelBlocker.Remove Button Title')
    },
    channelBlockerRemoveTempButtonTitle: function() {
      return this.$t('Settings.Distraction Free Settings.ChannelBlocker.Remove Temp Button Title')
    },
    promptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    }
  },
  watch:{
    channelBlockerAllowTempUnblock:function(){
      this._clearTempUnblock()
    }
  },
  methods: {
    handleHideRecommendedVideos: function (value) {
      if (value) {
        this.updatePlayNextVideo(false)
      }

      this.updateHideRecommendedVideos(value)
    },

    filterChannelBlockerList: function (query) {
      this.channelBlockerHasQuery = query !== ''

      // Escape every characters
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

      const filteredList = this._channelBlockerList.filter(channel => {
        return re.test(channel.author)
      })
      this.channelBlockerSearchResult = filteredList
    },

    onChannelBlockerRemoveButtonClicked: function (channel) {
      this.channelBlockerPromptText = this.$t('Settings.Distraction Free Settings.ChannelBlocker.Remove Prompt').replace('$', channel.author)
      this.channelBlockerChannelToRemove = channel
      this.showChannelBlockerRemovePrompt = true
    },

    removeChannelFromBlockList: function (option) {
      this.showChannelBlockerRemovePrompt = false
      if (option !== 'yes') {
        this.channelBlockerChannelToRemove = {}
        return
      }
      this._removeChannelFromBlockList(this.channelBlockerChannelToRemove)

      if (this.channelBlockerHasQuery) {
        const index = this.channelBlockerSearchResult.findIndex(item => {
          return item.authorId === this.channelBlockerChannelToRemove.authorId
        })
        this.channelBlockerSearchResult.splice(index, 1)
      }
    },

    onChannelBlockerRemoveTempUnblockButtonClicked: function(channel) {
      this.channelBlockerTempUnblockPromptText = this.$t('Settings.Distraction Free Settings.ChannelBlocker.Remove Temp Prompt').replace('$', channel.author)
      this.channelBlockerChannelToRemove = channel
      this.showChannelBlockerTempUnblockRemovePrompt = true
    },

    removeChannelFromTempUnblock: function(option) {
      this.showChannelBlockerTempUnblockRemovePrompt = false
      if (option !== 'yes') {
        this.channelBlockerChannelToRemove = {}
        return
      }
      this._removeChannelFromTempUnblock(this.channelBlockerChannelToRemove)
    },

    handleChannelBlockerAllowTempUnblock: function(option) {
      this.updateChannelBlockerAllowTempUnblock(option)
      if (!option) {
        this._clearTempUnblock()
      }
    },

    ...mapActions([
      'updateHideVideoViews',
      'updateHideVideoLikesAndDislikes',
      'updateHideChannelSubscriptions',
      'updateHideCommentLikes',
      'updateHideRecommendedVideos',
      'updateHideTrendingVideos',
      'updateHidePopularVideos',
      'updateHidePlaylists',
      'updateHideLiveChat',
      'updateHideActiveSubscriptions',
      'updatePlayNextVideo',
      'updateChannelBlockerSkipBlocked',
      'updateChannelBlockerAllowTempUnblock'
    ])
  }
})
