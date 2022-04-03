import { mapActions } from 'vuex'

const channelBlockerMixin = {
  data: function () {
    return {
      reChannelBlockerURI_: /^#\/($|subscriptions|channel|userplaylists|history)/,
      channelNameToastLength_: 80
    }
  },
  computed: {
    _currentLocale: async function () {
      let locale = this.$store.getters.getCurrentLocale
      if (locale === 'system') {
        locale = await this.getSystemLocale()
      }
      return locale
    },

    _channelBlockerList: function () {
      return this.$store.getters.getChannelBlockerList
    },

    _avoidChannelBlockerByURI: function () {
      // Will not hide:
      //  Subscriptions (#/ or #/subscriptions)
      //  Channel page (#/channel/UCuAXFkgsw1L7xaCfnd5JJOw) (if temp unblocked)
      //  User playlists (#/userplaylists)
      //  History (#/history)
      if (this.reChannelBlockerURI_.test(window.location.hash)) {
        return true
      }
      return false
    },

    _channelBlockerTempUnblockIdArray: function() {
      return this.$store.getters.getChannelBlockerTempUnblockIdArray
    }
  },
  methods: {
    _checkChannelBlocked: function (item) {
      const channelIndex = this._channelBlockerList.findIndex((blocked) => {
        // LocalAPI returns "channelID" on type "channel"
        return blocked.authorId === item.authorId || item.channelID
      })
      return channelIndex !== -1
    },

    _toggleBlockedChannel: function (channel) {
      // channel: {authorId: 'UCuAXFkgsw1L7xaCfnd5JJOw', author: 'Rick Astley'}
      if (this._checkChannelBlocked(channel)) {
        this._removeChannelFromBlockList(channel)
      } else {
        this._addChannelToBlockList(channel)
      }
    },

    _addChannelToBlockList: async function (channel) {
      console.log('adding channel', JSON.stringify(channel))

      const locale = await this._currentLocale.then(cl => {
        return cl.replace('_', '-')
      })

      const newList = this._channelBlockerList.slice()
      newList.push(channel)
      newList.sort((a, b) => {
        return a.author.localeCompare(b.author, locale, { ignorePunctuation: true })
      })
      this.updateChannelBlockerList(newList)

      this._showToastChannelBlocker(channel, this.$t('Video.Channel Blocked'))
    },

    _removeChannelFromBlockList: function (channel) {
      console.log('removing channel', JSON.stringify(channel))

      const index = this._channelBlockerList.findIndex(item => {
        return item.authorId === channel.authorId
      })

      const newList = this._channelBlockerList.concat([])
      newList.splice(index, 1)
      this.updateChannelBlockerList(newList)
      this.deleteChannelBlockerTempUnblockId(channel.authorId)

      this._showToastChannelBlocker(channel, this.$t('Video.Channel Unblocked'))
    },

    _checkChannelTempUnblocked: function(channel) {
      return this._channelBlockerTempUnblockIdArray.indexOf(channel.authorId || channel.channelID) !== -1
    },

    _addChannelToTempUnblock: function(channel) {
      console.log('adding channel temp', JSON.stringify(channel))
      this.addChannelBlockerTempUnblockId(channel.authorId)
      this._showToastChannelBlocker(channel, this.$t('Video.Channel Temp Unblocked'))
    },

    _removeChannelFromTempUnblock: function(channel) {
      console.log('removing channel temp', JSON.stringify(channel))
      this.deleteChannelBlockerTempUnblockId(channel.authorId)
      this._showToastChannelBlocker(channel, this.$t('Video.Channel Temp Unblock Removed'))
    },

    _clearTempUnblock: function() {
      console.log('clearing temp unblock')
      this.clearChannelBlockerTempUnblockId()
    },

    _showToastChannelBlocker: function(channel, text) {
      let message = null
      if (channel.author.length < this.channelNameToastLength_) {
        message = text.replace('$', channel.author)
      } else {
        message = text.replace('$', channel.author.slice(0, this.channelNameToastLength_ - 2) + '...')
      }

      this.showToast({
        message: message
      })
    },

    ...mapActions([
      'showToast',
      'getSystemLocale',
      'updateChannelBlockerList',
      'addChannelBlockerTempUnblockId',
      'deleteChannelBlockerTempUnblockId',
      'clearChannelBlockerTempUnblockId'
    ])
  }
}

export default channelBlockerMixin
