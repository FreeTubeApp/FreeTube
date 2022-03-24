import { mapActions } from 'vuex'

const channelBlockerMixin = {
  data: function () {
    return {
      re: /^#\/($|subscriptions|channel|userplaylists|history)/
    }
  },
  computed: {
    _currentLocale: async function () {
      let locale = this.$store.getters.getCurrentLocale
      if (locale === 'system') {
        locale = await this.getSystemLocale().then(sl => { return sl })
      }
      return locale
    },

    channelBlockerList: function () {
      return this.$store.getters.getChannelBlockerList
    },

    avoidChannelBlockerByURI: function () {
      // Will not hide:
      //  Subscriptions (#/ or #/subscriptions)
      //  Channel page (#/channel/UCuAXFkgsw1L7xaCfnd5JJOw) (show warning)
      //  User playlists (#/userplaylists)
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
      // channel: {authorId: 'UCuAXFkgsw1L7xaCfnd5JJOw', author: 'Rick Astley'}
      if (this.isChannelBlocked(channel)) {
        this.removeChannelFromBlockList(channel)
      } else {
        this.addChannelToBlockList(channel)
      }
    },

    addChannelToBlockList: async function (channel) {
      console.log('adding channel', JSON.stringify(channel))

      const locale = await this._currentLocale.then(cl => {
        return cl.replace('_', '-')
      })
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
      'getSystemLocale',
      'updateChannelBlockerList'
    ])
  }
}

export default channelBlockerMixin
