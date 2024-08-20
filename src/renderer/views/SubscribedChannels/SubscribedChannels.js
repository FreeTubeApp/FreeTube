import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSubscribeButton from '../../components/ft-subscribe-button/ft-subscribe-button.vue'
import { invidiousGetChannelInfo, youtubeImageUrlToInvidious, invidiousImageUrlToInvidious } from '../../helpers/api/invidious'
import { getLocalChannel, parseLocalChannelHeader } from '../../helpers/api/local'
import { ctrlFHandler } from '../../helpers/utils'
import { isNavigationFailure, NavigationFailureType } from 'vue-router'
import debounce from 'lodash.debounce'

export default defineComponent({
  name: 'SubscribedChannels',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-subscribe-button': FtSubscribeButton
  },
  data: function () {
    return {
      query: '',
      subscribedChannels: [],
      filteredChannels: [],
      re: {
        url: /(.+=\w)\d+(.+)/,
        ivToYt: /^.+ggpht\/(.+)/
      },
      thumbnailSize: 176,
      ytBaseURL: 'https://yt3.ggpht.com',
      errorCount: 0,
    }
  },
  computed: {
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    activeProfileId: function () {
      return this.activeProfile._id
    },

    activeSubscriptionList: function () {
      return this.activeProfile.subscriptions
    },

    channelList: function () {
      if (this.query !== '') {
        return this.filteredChannels
      } else {
        return this.subscribedChannels
      }
    },

    hideUnsubscribeButton: function() {
      return this.$store.getters.getHideUnsubscribeButton
    },

    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
    }
  },
  watch: {
    activeProfileId: function() {
      this.query = ''
      this.getSubscription()
    },

    activeSubscriptionList: function() {
      this.getSubscription()
      this.filterChannels()
    }
  },
  created: function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)

    this.filterChannelsDebounce = debounce(this.filterChannels, 500)
    this.getSubscription()

    const oldQuery = this.$route.query.searchQueryText ?? ''
    if (oldQuery !== null && oldQuery !== '') {
      // `handleQueryChange` must be called after `filterHistoryDebounce` assigned
      this.handleQueryChange(oldQuery, true)
    }
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    getSubscription: function () {
      this.subscribedChannels = this.activeSubscriptionList.slice().sort((a, b) => {
        return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), this.locale)
      })
    },

    filterChannels: function () {
      if (this.query === '') {
        this.filteredChannels = []
        return
      }

      const escapedQuery = this.query.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&')
      const re = new RegExp(escapedQuery, 'i')
      this.filteredChannels = this.subscribedChannels.filter(channel => {
        return re.test(channel.name)
      })
    },
    filterChannelsAsync: function() {
      // Updating list on every char input could be wasting resources on rendering
      // So run it with delay (to be cancelled when more input received within time)
      this.filterChannelsDebounce()
    },

    thumbnailURL: function(originalURL) {
      if (originalURL == null) { return null }
      let newURL = originalURL
      // Sometimes relative protocol URLs are passed in
      if (originalURL.startsWith('//')) {
        newURL = `https:${originalURL}`
      }
      const hostname = new URL(newURL).hostname
      if (hostname === 'yt3.ggpht.com' || hostname === 'yt3.googleusercontent.com') {
        if (this.backendPreference === 'invidious') { // YT to IV
          newURL = youtubeImageUrlToInvidious(newURL, this.currentInvidiousInstanceUrl)
        }
      } else {
        if (this.backendPreference === 'local') { // IV to YT
          newURL = newURL.replace(this.re.ivToYt, `${this.ytBaseURL}/$1`)
        } else { // IV to IV
          newURL = invidiousImageUrlToInvidious(newURL, this.currentInvidiousInstanceUrl)
        }
      }

      return newURL.replace(this.re.url, `$1${this.thumbnailSize}$2`)
    },

    updateThumbnail: function(channel) {
      this.errorCount += 1
      if (this.backendPreference === 'local') {
        // avoid too many concurrent requests
        setTimeout(() => {
          getLocalChannel(channel.id).then(response => {
            if (!response.alert) {
              this.updateSubscriptionDetails({
                channelThumbnailUrl: this.thumbnailURL(parseLocalChannelHeader(response).thumbnailUrl),
                channelName: channel.name,
                channelId: channel.id
              })
            }
          })
        }, this.errorCount * 500)
      } else {
        setTimeout(() => {
          invidiousGetChannelInfo(channel.id).then(response => {
            this.updateSubscriptionDetails({
              channelThumbnailUrl: this.thumbnailURL(response.authorThumbnails[0].url),
              channelName: channel.name,
              channelId: channel.id
            })
          })
        }, this.errorCount * 500)
      }
    },

    handleQueryChange(val, filterNow = false) {
      this.query = val

      this.saveStateInRouter(val)

      filterNow ? this.filterChannels() : this.filterChannelsAsync()
    },

    async saveStateInRouter(query) {
      if (this.query === '') {
        await this.$router.replace({ name: 'subscribedChannels' }).catch(failure => {
          if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
            return
          }

          throw failure
        })
        return
      }

      await this.$router.replace({
        name: 'subscribedChannels',
        query: { searchQueryText: query },
      }).catch(failure => {
        if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
          return
        }

        throw failure
      })
    },

    keyboardShortcutHandler: function (event) {
      ctrlFHandler(event, this.$refs.searchBarChannels)
    },

    ...mapActions([
      'updateSubscriptionDetails'
    ])
  }
})
