import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

export default Vue.extend({
  name: 'WatchVideoRecommendations',
  components: {
    'ft-card': FtCard,
    'ft-list-video': FtListVideo,
    'ft-toggle-switch': FtToggleSwitch
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    showAutoplay: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    },
    playNextVideo: function () {
      return this.$store.getters.getPlayNextVideo
    },
    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    },
    currentLocale: function () {
      return this.$store.getters.getCurrentLocale
    },
    channelBlockerList: function () {
      return this.$store.getters.getChannelBlockerList
    },
    channelBlockerFilteredData: function () {
      return this.data.filter(video => {
        return !this.isChannelBlocked(video)
      })
    }
  },
  methods: {
    isChannelBlocked: function (video) {
      const channelIndex = this.channelBlockerList.findIndex((item) => {
        return item.authorId === video.authorId
      })

      return channelIndex !== -1
    },

    toggleBlockedChannel: function (channel) {
      if (this.isChannelBlocked(channel)) {
        this.removeChannelFromBlockList(channel)
      } else {
        this.addChannelToBlockList(channel)
      }
    },

    addChannelToBlockList: function (channel) {
      console.log('adding channel', JSON.stringify(channel))

      const locale = this.currentLocale.replace('_', '-')
      const newList = this.channelBlockerList.slice()
      newList.push(channel)
      newList.sort((a, b) => {
        return a.author.localeCompare(b.author, locale)
      })
      this.updateChannelBlockerList(newList)

      this.showToast({
        message: `"${channel.author}" ${this.$t('Video.Channel has been added to the block list')}`
      })
    },

    removeChannelFromBlockList: function (channel) {
      console.log('removing channel', JSON.stringify(channel))

      const newList = this.channelBlockerList.slice()
      for (let i = newList.length - 1; i >= 0; i--) {
        if (newList[i].authorId === channel.authorId) {
          newList.splice(i, 1)
          break
        }
      }
      this.updateChannelBlockerList(newList)

      this.showToast({
        message: `"${channel.author}" ${this.$t('Video.Channel has been removed from the block list')}`
      })
    },

    ...mapActions([
      'updatePlayNextVideo',
      'showToast',
      'updateChannelBlockerList'
    ])
  }
})
