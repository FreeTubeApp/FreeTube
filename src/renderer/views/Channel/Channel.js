import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtAgeRestricted from '../../components/ft-age-restricted/ft-age-restricted.vue'

import ytch from 'yt-channel-info'
import autolinker from 'autolinker'
import { MAIN_PROFILE_ID } from '../../../constants'
import i18n from '../../i18n/index'
import { copyToClipboard, showToast } from '../../helpers/utils'

export default Vue.extend({
  name: 'Search',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-input': FtInput,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox,
    'ft-channel-bubble': FtChannelBubble,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList,
    'ft-age-restricted': FtAgeRestricted
  },
  data: function () {
    return {
      isLoading: false,
      isElementListLoading: false,
      currentTab: 'videos',
      id: '',
      idType: 0,
      channelName: '',
      bannerUrl: '',
      thumbnailUrl: '',
      subCount: 0,
      latestVideosPage: 2,
      searchPage: 2,
      videoContinuationString: '',
      playlistContinuationString: '',
      searchContinuationString: '',
      channelDescription: '',
      videoSortBy: 'newest',
      playlistSortBy: 'last',
      lastSearchQuery: '',
      relatedChannels: [],
      latestVideos: [],
      latestPlaylists: [],
      searchResults: [],
      shownElementList: [],
      apiUsed: '',
      isFamilyFriendly: false,
      errorMessage: '',
      videoSelectValues: [
        'newest',
        'oldest',
        'popular'
      ],
      playlistSelectValues: [
        'last',
        'newest'
      ]
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    hideUnsubscribeButton: function() {
      return this.$store.getters.getHideUnsubscribeButton
    },

    showFamilyFriendlyOnly: function() {
      return this.$store.getters.getShowFamilyFriendlyOnly
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    sessionSearchHistory: function () {
      return this.$store.getters.getSessionSearchHistory
    },

    profileList: function () {
      return this.$store.getters.getProfileList
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    subscriptionInfo: function () {
      return this.activeProfile.subscriptions.find((channel) => {
        return channel.id === this.id
      }) ?? null
    },

    isSubscribed: function () {
      return this.subscriptionInfo !== null
    },

    subscribedText: function () {
      if (this.isSubscribed) {
        return this.$t('Channel.Unsubscribe').toUpperCase()
      } else {
        return this.$t('Channel.Subscribe').toUpperCase()
      }
    },

    videoSelectNames: function () {
      return [
        this.$t('Channel.Videos.Sort Types.Newest'),
        this.$t('Channel.Videos.Sort Types.Oldest'),
        this.$t('Channel.Videos.Sort Types.Most Popular')
      ]
    },

    playlistSelectNames: function () {
      return [
        this.$t('Channel.Playlists.Sort Types.Last Video Added'),
        this.$t('Channel.Playlists.Sort Types.Newest')
      ]
    },

    currentLocale: function () {
      return i18n.locale.replace('_', '-')
    },

    formattedSubCount: function () {
      if (this.hideChannelSubscriptions) {
        return null
      }
      return Intl.NumberFormat(this.currentLocale).format(this.subCount)
    },

    showFetchMoreButton: function () {
      switch (this.currentTab) {
        case 'videos':
          if (this.apiUsed === 'invidious' || (this.videoContinuationString !== '' && this.videoContinuationString !== null)) {
            return true
          }
          break
        case 'playlists':
          if (this.playlistContinuationString !== '' && this.playlistContinuationString !== null) {
            return true
          }
          break
        case 'search':
          if (this.searchContinuationString !== '' && this.searchContinuationString !== null) {
            return true
          }
          break
      }

      return false
    },
    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    }
  },
  watch: {
    $route() {
      // react to route changes...
      this.originalId = this.$route.params.id
      this.id = this.$route.params.id
      this.idType = this.$route.query.idType ? Number(this.$route.query.idType) : 0
      this.currentTab = this.$route.params.currentTab ?? 'videos'
      this.latestVideosPage = 2
      this.searchPage = 2
      this.relatedChannels = []
      this.latestVideos = []
      this.latestPlaylists = []
      this.searchResults = []
      this.shownElementList = []
      this.apiUsed = ''
      this.isLoading = true

      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        this.getChannelInfoInvidious()
        this.getPlaylistsInvidious()
      } else {
        this.getChannelInfoLocal()
        this.getChannelVideosLocal()
        this.getPlaylistsLocal()
      }
    },

    videoSortBy () {
      this.isElementListLoading = true
      this.latestVideos = []
      switch (this.apiUsed) {
        case 'local':
          this.getChannelVideosLocal()
          break
        case 'invidious':
          this.latestVideosPage = 1
          this.channelInvidiousNextPage()
          break
        default:
          this.getChannelVideosLocal()
      }
    },

    playlistSortBy () {
      this.isElementListLoading = true
      this.latestPlaylists = []
      this.playlistContinuationString = ''
      switch (this.apiUsed) {
        case 'local':
          this.getPlaylistsLocal()
          break
        case 'invidious':
          this.channelInvidiousNextPage()
          break
        default:
          this.getPlaylistsLocal()
      }
    }
  },
  mounted: function () {
    this.originalId = this.$route.params.id
    this.id = this.$route.params.id
    this.idType = this.$route.query.idType ? Number(this.$route.query.idType) : 0
    this.currentTab = this.$route.params.currentTab ?? 'videos'
    this.isLoading = true

    if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
      this.getChannelInfoInvidious()
      this.getPlaylistsInvidious()
    } else {
      this.getChannelInfoLocal()
      this.getChannelVideosLocal()
      this.getPlaylistsLocal()
    }
  },
  methods: {
    goToChannel: function (id) {
      this.$router.push({ path: `/channel/${id}` })
    },

    getChannelInfoLocal: function () {
      this.apiUsed = 'local'
      const expectedId = this.originalId
      ytch.getChannelInfo({ channelId: this.id, channelIdType: this.idType }).then((response) => {
        if (response.alertMessage) {
          this.setErrorMessage(response.alertMessage)
          return
        }
        this.errorMessage = ''
        if (expectedId !== this.originalId) {
          return
        }

        const channelId = response.authorId
        const channelName = response.author
        const channelThumbnailUrl = response.authorThumbnails[2].url
        this.id = channelId
        // set the id type to 1 so that searching and sorting work
        this.idType = 1
        this.channelName = channelName
        this.isFamilyFriendly = response.isFamilyFriendly
        document.title = `${this.channelName} - ${process.env.PRODUCT_NAME}`
        if (this.hideChannelSubscriptions || response.subscriberCount === 0) {
          this.subCount = null
        } else {
          this.subCount = response.subscriberCount.toFixed(0)
        }
        this.thumbnailUrl = channelThumbnailUrl
        this.updateSubscriptionDetails({ channelThumbnailUrl, channelName, channelId })
        this.channelDescription = autolinker.link(response.description)
        this.relatedChannels = response.relatedChannels.items
        this.relatedChannels.forEach(relatedChannel => {
          relatedChannel.thumbnail.map(thumbnail => {
            if (!thumbnail.url.includes('https')) {
              thumbnail.url = `https:${thumbnail.url}`
            }
            return thumbnail
          })
          relatedChannel.authorThumbnails = relatedChannel.thumbnail
        })

        if (response.authorBanners !== null) {
          const bannerUrl = response.authorBanners[response.authorBanners.length - 1].url

          if (!bannerUrl.includes('https')) {
            this.bannerUrl = `https://${bannerUrl}`
          } else {
            this.bannerUrl = bannerUrl
          }
        } else {
          this.bannerUrl = null
        }

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getChannelInfoInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getChannelVideosLocal: function () {
      this.isElementListLoading = true
      const expectedId = this.originalId
      ytch.getChannelVideos({ channelId: this.id, channelIdType: this.idType, sortBy: this.videoSortBy }).then((response) => {
        if (expectedId !== this.originalId) {
          return
        }

        this.latestVideos = response.items
        this.videoContinuationString = response.continuation
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getChannelInfoInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    channelLocalNextPage: function () {
      ytch.getChannelVideosMore({ continuation: this.videoContinuationString }).then((response) => {
        this.latestVideos = this.latestVideos.concat(response.items)
        this.videoContinuationString = response.continuation
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      })
    },

    getChannelInfoInvidious: function () {
      this.isLoading = true
      this.apiUsed = 'invidious'

      const expectedId = this.originalId
      this.invidiousGetChannelInfo(this.id).then((response) => {
        if (expectedId !== this.originalId) {
          return
        }

        const channelName = response.author
        const channelId = response.authorId
        this.channelName = channelName
        document.title = `${this.channelName} - ${process.env.PRODUCT_NAME}`
        this.id = channelId
        this.isFamilyFriendly = response.isFamilyFriendly
        if (this.hideChannelSubscriptions) {
          this.subCount = null
        } else {
          this.subCount = response.subCount
        }
        const thumbnail = response.authorThumbnails[3].url
        this.thumbnailUrl = thumbnail.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
        this.updateSubscriptionDetails({ channelThumbnailUrl: thumbnail, channelName: channelName, channelId: channelId })
        this.channelDescription = autolinker.link(response.description)
        this.relatedChannels = response.relatedChannels.map((channel) => {
          channel.authorThumbnails[channel.authorThumbnails.length - 1].url = channel.authorThumbnails[channel.authorThumbnails.length - 1].url.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
          channel.channelId = channel.authorId
          return channel
        })
        this.latestVideos = response.latestVideos

        if (response.authorBanners instanceof Array && response.authorBanners.length > 0) {
          this.bannerUrl = response.authorBanners[0].url.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
        } else {
          this.bannerUrl = null
        }

        this.errorMessage = ''
        this.isLoading = false
      }).catch((err) => {
        this.setErrorMessage(err.responseJSON.error)
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err.responseJSON.error}`, 10000, () => {
          copyToClipboard(err.responseJSON.error)
        })
        this.isLoading = false
      })
    },

    channelInvidiousNextPage: function () {
      const payload = {
        resource: 'channels/videos',
        id: this.id,
        params: {
          sort_by: this.videoSortBy,
          page: this.latestVideosPage
        }
      }

      this.invidiousAPICall(payload).then((response) => {
        this.latestVideos = this.latestVideos.concat(response)
        this.latestVideosPage++
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      })
    },

    getPlaylistsLocal: function () {
      const expectedId = this.originalId
      ytch.getChannelPlaylistInfo({ channelId: this.id, channelIdType: this.idType, sortBy: this.playlistSortBy }).then((response) => {
        if (expectedId !== this.originalId) {
          return
        }

        this.latestPlaylists = response.items.map((item) => {
          item.proxyThumbnail = false
          return item
        })
        this.playlistContinuationString = response.continuation
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getPlaylistsInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistsLocalMore: function () {
      ytch.getChannelPlaylistsMore({ continuation: this.playlistContinuationString }).then((response) => {
        this.latestPlaylists = this.latestPlaylists.concat(response.items)
        this.playlistContinuationString = response.continuation
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      })
    },

    getPlaylistsInvidious: function () {
      const payload = {
        resource: 'channels/playlists',
        id: this.id,
        params: {
          sort_by: this.playlistSortBy
        }
      }

      this.invidiousAPICall(payload).then((response) => {
        this.playlistContinuationString = response.continuation
        this.latestPlaylists = response.playlists
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err.responseJSON.error}`, 10000, () => {
          copyToClipboard(err.responseJSON.error)
        })
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.getPlaylistsLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistsInvidiousMore: function () {
      if (this.playlistContinuationString === null) {
        console.warn('There are no more playlists available for this channel')
        return
      }

      const payload = {
        resource: 'channels/playlists',
        id: this.id,
        params: {
          sort_by: this.playlistSortBy
        }
      }

      if (this.playlistContinuationString) {
        payload.params.continuation = this.playlistContinuationString
      }

      this.invidiousAPICall(payload).then((response) => {
        this.playlistContinuationString = response.continuation
        this.latestPlaylists = this.latestPlaylists.concat(response.playlists)
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err.responseJSON.error}`, 10000, () => {
          copyToClipboard(err.responseJSON.error)
        })
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.getPlaylistsLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    handleSubscription: function () {
      const currentProfile = JSON.parse(JSON.stringify(this.activeProfile))
      const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))

      if (this.isSubscribed) {
        currentProfile.subscriptions = currentProfile.subscriptions.filter((channel) => {
          return channel.id !== this.id
        })

        this.updateProfile(currentProfile)
        showToast(this.$t('Channel.Channel has been removed from your subscriptions'))

        if (this.activeProfile._id === MAIN_PROFILE_ID) {
          // Check if a subscription exists in a different profile.
          // Remove from there as well.
          let duplicateSubscriptions = 0

          this.profileList.forEach((profile) => {
            if (profile._id === MAIN_PROFILE_ID) {
              return
            }
            const parsedProfile = JSON.parse(JSON.stringify(profile))
            const index = parsedProfile.subscriptions.findIndex((channel) => {
              return channel.id === this.id
            })

            if (index !== -1) {
              duplicateSubscriptions++

              parsedProfile.subscriptions = parsedProfile.subscriptions.filter((x) => {
                return x.id !== this.id
              })

              this.updateProfile(parsedProfile)
            }
          })

          if (duplicateSubscriptions > 0) {
            const message = this.$t('Channel.Removed subscription from {count} other channel(s)', { count: duplicateSubscriptions })
            showToast(message)
          }
        }
      } else {
        const subscription = {
          id: this.id,
          name: this.channelName,
          thumbnail: this.thumbnailUrl
        }
        currentProfile.subscriptions.push(subscription)

        this.updateProfile(currentProfile)
        showToast(this.$t('Channel.Added channel to your subscriptions'))

        if (this.activeProfile._id !== MAIN_PROFILE_ID) {
          const index = primaryProfile.subscriptions.findIndex((channel) => {
            return channel.id === this.id
          })

          if (index === -1) {
            primaryProfile.subscriptions.push(subscription)
            this.updateProfile(primaryProfile)
          }
        }
      }
    },

    setErrorMessage: function (errorMessage) {
      this.isLoading = false
      this.errorMessage = errorMessage
      this.id = this.subscriptionInfo.id
      this.channelName = this.subscriptionInfo.name
      this.thumbnailUrl = this.subscriptionInfo.thumbnail
      this.bannerUrl = null
      this.subCount = null
    },

    handleFetchMore: function () {
      switch (this.currentTab) {
        case 'videos':
          switch (this.apiUsed) {
            case 'local':
              this.channelLocalNextPage()
              break
            case 'invidious':
              this.channelInvidiousNextPage()
              break
          }
          break
        case 'playlists':
          switch (this.apiUsed) {
            case 'local':
              this.getPlaylistsLocalMore()
              break
            case 'invidious':
              this.getPlaylistsInvidiousMore()
              break
          }
          break
        case 'search':
          switch (this.apiUsed) {
            case 'local':
              this.searchChannelLocal()
              break
            case 'invidious':
              this.searchChannelInvidious()
              break
          }
          break
      }
    },

    changeTab: function (tab) {
      this.currentTab = tab
    },

    newSearch: function (query) {
      this.lastSearchQuery = query
      this.searchContinuationString = ''
      this.isElementListLoading = true
      this.searchPage = 1
      this.searchResults = []
      this.changeTab('search')
      switch (this.apiUsed) {
        case 'local':
          this.searchChannelLocal()
          break
        case 'invidious':
          this.searchChannelInvidious()
          break
      }
    },

    searchChannelLocal: function () {
      if (this.searchContinuationString === '') {
        ytch.searchChannel({ channelId: this.id, channelIdType: this.idType, query: this.lastSearchQuery }).then((response) => {
          this.searchResults = response.items
          this.isElementListLoading = false
          this.searchContinuationString = response.continuation
        }).catch((err) => {
          console.error(err)
          const errorMessage = this.$t('Local API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
          if (this.backendPreference === 'local' && this.backendFallback) {
            showToast(this.$t('Falling back to Invidious API'))
            this.searchChannelInvidious()
          } else {
            this.isLoading = false
          }
        })
      } else {
        ytch.searchChannelMore({ continuation: this.searchContinuationString }).then((response) => {
          this.searchResults = this.searchResults.concat(response.items)
          this.isElementListLoading = false
          this.searchContinuationString = response.continuation
        }).catch((err) => {
          console.error(err)
          const errorMessage = this.$t('Local API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
        })
      }
    },

    searchChannelInvidious: function () {
      const payload = {
        resource: 'channels/search',
        id: this.id,
        params: {
          q: this.lastSearchQuery,
          page: this.searchPage
        }
      }

      this.invidiousAPICall(payload).then((response) => {
        this.searchResults = this.searchResults.concat(response)
        this.isElementListLoading = false
        this.searchPage++
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.searchChannelLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    ...mapActions([
      'updateProfile',
      'invidiousGetChannelInfo',
      'invidiousAPICall',
      'updateSubscriptionDetails'
    ])
  }
})
