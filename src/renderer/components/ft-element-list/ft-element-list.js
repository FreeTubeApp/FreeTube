import Vue from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtAutoGrid from '../ft-auto-grid/ft-auto-grid.vue'
import FtListLazyWrapper from '../ft-list-lazy-wrapper/ft-list-lazy-wrapper.vue'
import { mapActions } from 'vuex'

export default Vue.extend({
  name: 'FtElementList',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-auto-grid': FtAutoGrid,
    'ft-list-lazy-wrapper': FtListLazyWrapper
  },
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  data: function () {
    return {
      test: 'hello',
      re: /^#\/($|subscriptions|channel|userplaylists|history)/
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    },

    channelBlockerCache: function () {
      return this.$store.getters.getChannelBlockerCache
    },

    avoidChannelBlockerByURI: function () {
      // Won't hide:
      //  Subscriptions (#/ or #/subscriptions)
      //  Channel page (#/channel/UCuAXFkgsw1L7xaCfnd5JJOw)
      //  Your playlists (#/userplaylists)
      //  History (#/history)
      const match = window.location.hash.match(this.re)
      if (match === null) {
        return false
      }
      return true
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
      'showToast',
      'channelBlockerAddChannel',
      'channelBlockerRemoveChannelById',
      'compactBlockedChannels'
    ])
  }
})
