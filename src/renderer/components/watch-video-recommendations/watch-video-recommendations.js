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
    channelBlockerCache: function () {
      return this.$store.getters.getChannelBlockerCache
    },
    channelBlockerFilteredData: function () {
      return this.data.filter(video => {
        return !this.isChannelBlocked(video)
      })
    }
  },
  methods: {
    isChannelBlocked: function (video) {
      const channelIndex = this.channelBlockerCache.findIndex((item) => {
        return item._id === video.authorId
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
      console.log('adding', channel)
      const newChannel = {
        _id: channel.authorId,
        name: channel.author
      }

      this.channelBlockerAddChannel(newChannel).then(_ => {
        this.showToast({
          message: `"${newChannel.name}" ${this.$t('Video.Channel has been added to the block list')}`
        })
      }).catch(err => {
        console.error(err)
      })
    },

    removeChannelFromBlockList: function (channel) {
      console.log('removing', channel)
      this.channelBlockerRemoveChannelById(channel.authorId).then(_ => {
        this.compactBlockedChannels()
        this.showToast({
          message: `"${channel.author}" ${this.$t('Video.Channel has been removed from the block list')}`
        })
      }).catch(err => {
        console.error(err)
      })
    },

    ...mapActions([
      'updatePlayNextVideo',
      'showToast',
      'channelBlockerAddChannel',
      'channelBlockerRemoveChannelById',
      'compactBlockedChannels'
    ])
  }
})
