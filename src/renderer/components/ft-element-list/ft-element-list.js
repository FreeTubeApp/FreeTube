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
    },
    showBlockedItems: {
      type: Boolean,
      default: false
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

    currentLocale: function () {
      return this.$store.getters.getCurrentLocale
    },

    channelBlockerList: function () {
      return this.$store.getters.getChannelBlockerList
    },

    avoidChannelBlockerByURI: function () {
      // Won't hide:
      //  Subscriptions (#/ or #/subscriptions)
      //  Channel page (#/channel/UCuAXFkgsw1L7xaCfnd5JJOw)
      //  Your playlists (#/userplaylists)
      //  History (#/history)
      if (this.re.test(window.location.hash)) {
        return true
      }
      return false
    }
  },
  methods: {
    isChannelBlocked: function (item) {
      const channelIndex = this.channelBlockerList.findIndex((blocked) => {
        return blocked.authorId === item.authorId
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
      // channel: {authorId: 'UCuAXFkgsw1L7xaCfnd5JJOw', author: 'Rick Astley'}
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
      'showToast',
      'updateChannelBlockerList'
    ])
  }
})
