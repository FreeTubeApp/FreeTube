import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'

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
  data: function () {
    return {
      channelBlockerHasQuery: false,
      channelBlockerSearchResult: [],
      channelBlockerChannelToRemove: {},
      channelBlockerPromptText: '',
      showChannelBlockerRemovePrompt: false,
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
    channelBlockerList: function () {
      return this.$store.getters.getChannelBlockerList
    },
    channelBlockerShownList: function () {
      if (this.channelBlockerHasQuery) {
        return this.channelBlockerSearchResult
      } else {
        return this.channelBlockerList
      }
    },
    promptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
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

      const filteredList = this.channelBlockerList.filter(channel => {
        return re.test(channel.author)
      })
      this.channelBlockerSearchResult = filteredList
    },

    onChannelBlockerRemoveButtonClicked: function (channel) {
      this.channelBlockerPromptText = this.$t('Settings.Distraction Free Settings.ChannelBlocker Delete Prompt').replace('$', channel.author)
      this.channelBlockerChannelToRemove = channel
      this.showChannelBlockerRemovePrompt = true
    },

    removeChannelFromBlockList: function (option) {
      this.showChannelBlockerRemovePrompt = false
      if (option !== 'yes') {
        return
      }

      const channel = this.channelBlockerChannelToRemove
      console.log('removing channel', JSON.stringify(channel))

      const newList = this.channelBlockerList.slice()
      for (let i = newList.length - 1; i >= 0; i--) {
        if (newList[i].authorId === channel.authorId) {
          newList.splice(i, 1)
          break
        }
      }
      this.updateChannelBlockerList(newList)

      if (this.channelBlockerHasQuery) {
        const newSearchResult = this.channelBlockerSearchResult.slice()
        for (let i = newSearchResult.length - 1; i >= 0; i--) {
          if (newSearchResult[i].authorId === channel.authorId) {
            newSearchResult.splice(i, 1)
            break
          }
        }
        this.channelBlockerSearchResult = newSearchResult
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
      'updateChannelBlockerAllowTempUnblock',
      'updateChannelBlockerList'
    ])
  }
})
