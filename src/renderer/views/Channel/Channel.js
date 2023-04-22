import { defineComponent } from 'vue'
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
import FtShareButton from '../../components/ft-share-button/ft-share-button.vue'

import autolinker from 'autolinker'
import { MAIN_PROFILE_ID } from '../../../constants'
import { copyToClipboard, extractNumberFromString, formatNumber, isNullOrEmpty, showToast } from '../../helpers/utils'
import packageDetails from '../../../../package.json'
import {
  invidiousAPICall,
  invidiousGetChannelId,
  invidiousGetChannelInfo,
  invidiousGetCommunityPosts,
  youtubeImageUrlToInvidious
} from '../../helpers/api/invidious'
import {
  getLocalChannel,
  getLocalChannelId,
  parseLocalChannelVideos,
  parseLocalCommunityPost,
  parseLocalListPlaylist,
  parseLocalListVideo,
  parseLocalSubscriberCount
} from '../../helpers/api/local'

export default defineComponent({
  name: 'Channel',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-input': FtInput,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox,
    'ft-channel-bubble': FtChannelBubble,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList,
    'ft-age-restricted': FtAgeRestricted,
    'ft-share-button': FtShareButton
  },
  data: function () {
    return {
      isLoading: false,
      isElementListLoading: false,
      currentTab: 'videos',
      id: '',
      channelInstance: null,
      channelName: '',
      bannerUrl: '',
      thumbnailUrl: '',
      subCount: 0,
      searchPage: 2,
      videoContinuationData: null,
      liveContinuationData: null,
      playlistContinuationData: null,
      searchContinuationData: null,
      communityContinuationData: null,
      description: '',
      tags: [],
      views: 0,
      joined: 0,
      location: null,
      videoSortBy: 'newest',
      liveSortBy: 'newest',
      playlistSortBy: 'newest',
      showVideoSortBy: true,
      showLiveSortBy: true,
      showPlaylistSortBy: true,
      lastSearchQuery: '',
      relatedChannels: [],
      latestVideos: [],
      latestLive: [],
      latestPlaylists: [],
      latestCommunityPosts: [],
      searchResults: [],
      shownElementList: [],
      apiUsed: '',
      isFamilyFriendly: false,
      errorMessage: '',
      showSearchBar: true,
      showShareMenu: true,
      videoShortLiveSelectValues: [
        'newest',
        'popular'
      ],
      playlistSelectValues: [
        'newest',
        'last'
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

    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
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

    videoShortLiveSelectNames: function () {
      return [
        this.$t('Channel.Videos.Sort Types.Newest'),
        this.$t('Channel.Videos.Sort Types.Most Popular')
      ]
    },

    playlistSelectNames: function () {
      return [
        this.$t('Channel.Playlists.Sort Types.Newest'),
        this.$t('Channel.Playlists.Sort Types.Last Video Added')
      ]
    },

    formattedSubCount: function () {
      if (this.hideChannelSubscriptions) {
        return null
      }
      return formatNumber(this.subCount)
    },

    formattedViews: function () {
      return formatNumber(this.views)
    },

    formattedJoined: function () {
      return new Intl.DateTimeFormat([this.currentLocale, 'en'], { dateStyle: 'long' }).format(this.joined)
    },

    showFetchMoreButton: function () {
      switch (this.currentTab) {
        case 'videos':
          return !isNullOrEmpty(this.videoContinuationData)
        case 'live':
          return !isNullOrEmpty(this.liveContinuationData)
        case 'playlists':
          return !isNullOrEmpty(this.playlistContinuationData)
        case 'community':
          return !isNullOrEmpty(this.communityContinuationData)
        case 'search':
          return !isNullOrEmpty(this.searchContinuationData)
      }

      return false
    },
    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    },

    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },

    hideSearchBar: function () {
      return this.$store.getters.getHideSearchBar
    },

    hideSharingActions: function () {
      return this.$store.getters.getHideSharingActions
    },

    hideLiveStreams: function () {
      return this.$store.getters.getHideLiveStreams
    },

    tabInfoValues: function () {
      const values = [
        'videos',
        'live',
        'playlists',
        'community',
        'about'
      ]

      // remove tabs from the array based on user settings
      if (this.hideLiveStreams) {
        const index = values.indexOf('live')
        values.splice(index, 1)
      }

      return values
    }
  },
  watch: {
    $route() {
      // react to route changes...
      this.isLoading = true

      if (this.$route.query.url) {
        this.resolveChannelUrl(this.$route.query.url, this.$route.params.currentTab)
        return
      }

      this.id = this.$route.params.id
      let currentTab = this.$route.params.currentTab ?? 'videos'
      this.searchPage = 2
      this.relatedChannels = []
      this.latestVideos = []
      this.latestLive = []
      this.liveSortBy = 'newest'
      this.latestPlaylists = []
      this.latestCommunityPosts = []
      this.searchResults = []
      this.shownElementList = []
      this.apiUsed = ''
      this.channelInstance = ''
      this.videoContinuationData = null
      this.liveContinuationData = null
      this.playlistContinuationData = null
      this.searchContinuationData = null
      this.communityContinuationData = null
      this.showSearchBar = true
      this.showVideoSortBy = true
      this.showLiveSortBy = true
      this.showPlaylistSortBy = true

      if (this.hideLiveStreams && currentTab === 'live') {
        currentTab = 'videos'
      }

      this.currentTab = currentTab

      if (this.id === '@@@') {
        this.showShareMenu = false
        this.setErrorMessage(this.$i18n.t('Channel.This channel does not exist'))
        return
      }

      this.showShareMenu = true
      this.errorMessage = ''

      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        this.getChannelInfoInvidious()
      } else {
        this.getChannelLocal()
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
          this.channelInvidiousVideos(true)
          break
        default:
          this.getChannelVideosLocal()
      }
    },

    liveSortBy () {
      this.isElementListLoading = true
      this.latestLive = []
      switch (this.apiUsed) {
        case 'local':
          this.getChannelLiveLocal()
          break
        case 'invidious':
          this.channelInvidiousLive(true)
          break
        default:
          this.getChannelLiveLocal()
      }
    },

    playlistSortBy () {
      this.isElementListLoading = true
      this.latestPlaylists = []
      this.playlistContinuationData = null
      switch (this.apiUsed) {
        case 'local':
          this.getChannelPlaylistsLocal()
          break
        case 'invidious':
          this.getPlaylistsInvidious()
          break
        default:
          this.getChannelPlaylistsLocal()
      }
    }
  },
  mounted: function () {
    this.isLoading = true

    if (this.$route.query.url) {
      this.resolveChannelUrl(this.$route.query.url, this.$route.params.currentTab)
      return
    }

    this.id = this.$route.params.id

    let currentTab = this.$route.params.currentTab ?? 'videos'

    if (this.hideLiveStreams && currentTab === 'live') {
      currentTab = 'videos'
    }

    this.currentTab = currentTab

    if (this.id === '@@@') {
      this.showShareMenu = false
      this.setErrorMessage(this.$i18n.t('Channel.This channel does not exist'))
      return
    }

    if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
      this.getChannelInfoInvidious()
    } else {
      this.getChannelLocal()
    }
  },
  methods: {
    resolveChannelUrl: async function (url, tab = undefined) {
      let id

      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        id = await invidiousGetChannelId(url)
      } else {
        id = await getLocalChannelId(url)
      }

      if (id === null) {
        // the channel page shows an error about the channel not existing when the id is @@@
        id = '@@@'
      }

      // use router.replace to replace the current history entry
      // with the one with the resolved channel id
      // that way if you navigate back or forward in the history to this entry
      // we don't need to resolve the URL again as we already know it
      if (tab) {
        this.$router.replace({ path: `/channel/${id}/${tab}` })
      } else {
        this.$router.replace({ path: `/channel/${id}` })
      }
    },

    goToChannel: function (id) {
      this.$router.push({ path: `/channel/${id}` })
    },

    getChannelLocal: async function () {
      this.apiUsed = 'local'
      this.isLoading = true
      const expectedId = this.id

      try {
        let channel
        if (!this.channelInstance) {
          channel = await getLocalChannel(this.id)
        } else {
          channel = this.channelInstance
        }

        let channelName
        let channelThumbnailUrl

        if (channel.alert) {
          this.setErrorMessage(channel.alert)
          return
        } else if (channel.memo.has('ChannelAgeGate')) {
          /** @type {import('youtubei.js/dist/src/parser/classes/ChannelAgeGate').default} */
          const ageGate = channel.memo.get('ChannelAgeGate')[0]

          channelName = ageGate.channel_title
          channelThumbnailUrl = ageGate.avatar[0].url

          this.channelName = channelName
          this.thumbnailUrl = channelThumbnailUrl

          document.title = `${channelName} - ${packageDetails.productName}`

          this.updateSubscriptionDetails({ channelThumbnailUrl, channelName, channelId: this.id })

          this.setErrorMessage(this.$t('Channel["This channel is age-restricted and currently cannot be viewed in FreeTube."]'), true)
          return
        }

        this.errorMessage = ''
        if (expectedId !== this.id) {
          return
        }

        let channelId
        let subscriberText = null
        let tags = []

        switch (channel.header.type) {
          case 'C4TabbedHeader': {
            // example: Linus Tech Tips
            // https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw

            /**
             * @type {import('youtubei.js/dist/src/parser/classes/C4TabbedHeader').default}
             */
            const header = channel.header

            channelId = header.author.id
            channelName = header.author.name
            channelThumbnailUrl = header.author.best_thumbnail.url
            subscriberText = header.subscribers?.text
            break
          }
          case 'CarouselHeader': {
            // examples: Music and YouTube Gaming
            // https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ
            // https://www.youtube.com/channel/UCOpNcN46UbXVtpKMrmU4Abg

            /**
             * @type {import('youtubei.js/dist/src/parser/classes/CarouselHeader').default}
             */
            const header = channel.header

            /**
             * @type {import('youtubei.js/dist/src/parser/classes/TopicChannelDetails').default}
             */
            const topicChannelDetails = header.contents.find(node => node.type === 'TopicChannelDetails')
            channelName = topicChannelDetails.title.text
            subscriberText = topicChannelDetails.subtitle.text
            channelThumbnailUrl = topicChannelDetails.avatar[0].url

            if (channel.metadata.external_id) {
              channelId = channel.metadata.external_id
            } else {
              channelId = topicChannelDetails.subscribe_button.channel_id
            }
            break
          }
          case 'InteractiveTabbedHeader': {
            // example: Minecraft - Topic
            // https://www.youtube.com/channel/UCQvWX73GQygcwXOTSf_VDVg

            /**
             * @type {import('youtubei.js/dist/src/parser/classes/InteractiveTabbedHeader').default}
             */
            const header = channel.header
            channelName = header.title.text
            channelId = this.id
            channelThumbnailUrl = header.box_art.at(-1).url

            const badges = header.badges.map(badge => badge.label).filter(tag => tag)
            tags.push(...badges)
            break
          }
        }

        this.channelName = channelName
        this.thumbnailUrl = channelThumbnailUrl
        this.isFamilyFriendly = !!channel.metadata.is_family_safe

        if (channel.metadata.tags) {
          tags.push(...channel.metadata.tags)
        }

        // deduplicate tags
        // a Set can only ever contain unique elements,
        // so this is an easy way to get rid of duplicates
        if (tags.length > 0) {
          tags = Array.from(new Set(tags))
        }
        this.tags = tags

        document.title = `${channelName} - ${packageDetails.productName}`

        if (!this.hideChannelSubscriptions && subscriberText) {
          const subCount = parseLocalSubscriberCount(subscriberText)

          if (isNaN(subCount)) {
            this.subCount = null
          } else {
            this.subCount = subCount
          }
        } else {
          this.subCount = null
        }

        this.updateSubscriptionDetails({ channelThumbnailUrl, channelName, channelId })

        if (channel.header.banner?.length > 0) {
          this.bannerUrl = channel.header.banner[0].url
        } else {
          this.bannerUrl = null
        }

        this.relatedChannels = channel.channels.map(({ author }) => {
          let thumbnailUrl = author.best_thumbnail.url

          if (thumbnailUrl.startsWith('//')) {
            thumbnailUrl = `https:${thumbnailUrl}`
          }

          return {
            name: author.name,
            id: author.id,
            thumbnailUrl
          }
        })

        this.channelInstance = channel

        if (channel.has_about) {
          this.getChannelAboutLocal()
        } else {
          this.description = ''
          this.views = null
          this.joined = 0
          this.location = null
        }

        if (channel.has_videos) {
          this.getChannelVideosLocal()
        }

        if (!this.hideLiveStreams && channel.has_live_streams) {
          this.getChannelLiveLocal()
        }

        if (channel.has_playlists) {
          this.getChannelPlaylistsLocal()
        }

        if (channel.has_community) {
          this.getCommunityPostsLocal()
        }

        this.showSearchBar = channel.has_search

        this.isLoading = false
      } catch (err) {
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
      }
    },

    getChannelAboutLocal: async function () {
      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').default}
        */
        const channel = this.channelInstance
        const about = await channel.getAbout()

        this.description = about.description.text !== 'N/A' ? autolinker.link(about.description.text) : ''

        const views = extractNumberFromString(about.views.text)
        this.views = isNaN(views) ? null : views

        this.joined = about.joined.text !== 'N/A' ? new Date(about.joined.text.replace('Joined').trim()) : 0

        this.location = about.country.text !== 'N/A' ? about.country.text : null
      } catch (err) {
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
      }
    },

    getChannelVideosLocal: async function () {
      this.isElementListLoading = true
      const expectedId = this.id

      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').default}
        */
        const channel = this.channelInstance
        let videosTab = await channel.getVideos()

        this.showVideoSortBy = videosTab.filters.length > 1

        if (this.showVideoSortBy && this.videoSortBy !== 'newest') {
          const index = this.videoShortLiveSelectValues.indexOf(this.videoSortBy)
          videosTab = await videosTab.applyFilter(videosTab.filters[index])
        }

        if (expectedId !== this.id) {
          return
        }

        this.latestVideos = parseLocalChannelVideos(videosTab.videos, channel.header.author)
        this.videoContinuationData = videosTab.has_continuation ? videosTab : null
        this.isElementListLoading = false
      } catch (err) {
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
      }
    },

    channelLocalNextPage: async function () {
      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').ChannelListContinuation|import('youtubei.js/dist/src/parser/youtube/Channel').FilteredChannelList}
         */
        const continuation = await this.videoContinuationData.getContinuation()

        this.latestVideos = this.latestVideos.concat(parseLocalChannelVideos(continuation.videos, this.channelInstance.header.author))
        this.videoContinuationData = continuation.has_continuation ? continuation : null
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      }
    },

    getChannelLiveLocal: async function () {
      this.isElementListLoading = true
      const expectedId = this.id

      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').default}
        */
        const channel = this.channelInstance
        let liveTab = await channel.getLiveStreams()

        this.showLiveSortBy = liveTab.filters.length > 1

        if (this.showLiveSortBy && this.liveSortBy !== 'newest') {
          const index = this.videoShortLiveSelectValues.indexOf(this.liveSortBy)
          liveTab = await liveTab.applyFilter(liveTab.filters[index])
        }

        if (expectedId !== this.id) {
          return
        }

        this.latestLive = parseLocalChannelVideos(liveTab.videos, channel.header.author)
        this.liveContinuationData = liveTab.has_continuation ? liveTab : null
        this.isElementListLoading = false
      } catch (err) {
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
      }
    },

    getChannelLiveLocalMore: async function () {
      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').ChannelListContinuation|import('youtubei.js/dist/src/parser/youtube/Channel').FilteredChannelList}
         */
        const continuation = await this.liveContinuationData.getContinuation()

        this.latestLive.push(...parseLocalChannelVideos(continuation.videos, this.channelInstance.header.author))
        this.liveContinuationData = continuation.has_continuation ? continuation : null
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      }
    },

    getChannelInfoInvidious: function () {
      this.isLoading = true
      this.apiUsed = 'invidious'
      this.channelInstance = null

      const expectedId = this.id
      invidiousGetChannelInfo(this.id).then((response) => {
        if (expectedId !== this.id) {
          return
        }

        const channelName = response.author
        const channelId = response.authorId
        this.channelName = channelName
        document.title = `${this.channelName} - ${packageDetails.productName}`
        this.id = channelId
        this.isFamilyFriendly = response.isFamilyFriendly
        if (this.hideChannelSubscriptions) {
          this.subCount = null
        } else {
          this.subCount = response.subCount
        }
        const thumbnail = response.authorThumbnails[3].url
        this.thumbnailUrl = youtubeImageUrlToInvidious(thumbnail, this.currentInvidiousInstance)
        this.updateSubscriptionDetails({ channelThumbnailUrl: thumbnail, channelName: channelName, channelId: channelId })
        this.description = autolinker.link(response.description)
        this.views = response.totalViews
        this.joined = response.joined > 0 ? new Date(response.joined * 1000) : 0
        this.relatedChannels = response.relatedChannels.map((channel) => {
          const thumbnailUrl = channel.authorThumbnails.at(-1).url
          return {
            name: channel.author,
            id: channel.authorId,
            thumbnailUrl: youtubeImageUrlToInvidious(thumbnailUrl, this.currentInvidiousInstance)
          }
        })
        this.latestVideos = response.latestVideos

        if (response.authorBanners instanceof Array && response.authorBanners.length > 0) {
          this.bannerUrl = youtubeImageUrlToInvidious(response.authorBanners[0].url, this.currentInvidiousInstance)
        } else {
          this.bannerUrl = null
        }

        this.errorMessage = ''

        // some channels only have a few tabs
        // here are all possible values: home, videos, shorts, streams, playlists, community, channels, about

        if (response.tabs.includes('videos')) {
          this.channelInvidiousVideos()
        }

        if (!this.hideLiveStreams && response.tabs.includes('streams')) {
          this.channelInvidiousLive()
        }

        if (response.tabs.includes('playlists')) {
          this.getPlaylistsInvidious()
        }

        if (response.tabs.includes('community')) {
          this.getCommunityPostsInvidious()
        }

        this.isLoading = false
      }).catch((err) => {
        this.setErrorMessage(err)
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.getChannelLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    channelInvidiousVideos: function (sortByChanged) {
      const payload = {
        resource: 'channels/videos',
        id: this.id,
        params: {
          sort_by: this.videoSortBy,
        }
      }

      if (sortByChanged) {
        this.videoContinuationData = null
      }

      let more = false
      if (this.videoContinuationData) {
        payload.params.continuation = this.videoContinuationData
        more = true
      }

      if (!more) {
        this.isElementListLoading = true
      }

      invidiousAPICall(payload).then((response) => {
        if (more) {
          this.latestVideos = this.latestVideos.concat(response.videos)
        } else {
          this.latestVideos = response.videos
        }
        this.videoContinuationData = response.continuation || null
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      })
    },

    channelInvidiousLive: function (sortByChanged) {
      const payload = {
        resource: 'channels',
        id: this.id,
        subResource: 'streams',
        params: {
          sort_by: this.liveSortBy,
        }
      }

      if (sortByChanged) {
        this.liveContinuationData = null
      }

      let more = false
      if (this.liveContinuationData) {
        payload.params.continuation = this.liveContinuationData
        more = true
      }

      if (!more) {
        this.isElementListLoading = true
      }

      invidiousAPICall(payload).then((response) => {
        if (more) {
          this.latestLive.push(...response.videos)
        } else {
          this.latestLive = response.videos
        }
        this.liveContinuationData = response.continuation || null
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      })
    },

    getChannelPlaylistsLocal: async function () {
      const expectedId = this.id

      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').default}
         */
        const channel = this.channelInstance
        let playlistsTab = await channel.getPlaylists()

        // some channels have more categories of playlists than just "Created Playlists" e.g. https://www.youtube.com/channel/UCez-2shYlHQY3LfILBuDYqQ
        // for the moment we just want the "Created Playlists" category that has all playlists in it

        if (playlistsTab.content_type_filters.length > 1) {
          /**
           * @type {import('youtubei.js/dist/src/parser/classes/ChannelSubMenu').default}
           */
          const menu = playlistsTab.current_tab.content.sub_menu
          const createdPlaylistsFilter = menu.content_type_sub_menu_items.find(contentType => {
            const url = `https://youtube.com/${contentType.endpoint.metadata.url}`
            return new URL(url).searchParams.get('view') === '1'
          }).title

          playlistsTab = await playlistsTab.applyContentTypeFilter(createdPlaylistsFilter)
        }

        // YouTube seems to allow the playlists tab to be sorted even if it only has one playlist
        // as it doesn't make sense to sort a list with a single playlist in it, we'll hide the sort by element if there is a single playlist
        this.showPlaylistSortBy = playlistsTab.sort_filters.length > 1 && playlistsTab.playlists.length > 1

        if (this.showPlaylistSortBy && this.playlistSortBy !== 'newest') {
          const index = this.playlistSelectValues.indexOf(this.playlistSortBy)
          playlistsTab = await playlistsTab.applySort(playlistsTab.sort_filters[index])
        }

        if (expectedId !== this.id) {
          return
        }

        this.latestPlaylists = playlistsTab.playlists.map(playlist => parseLocalListPlaylist(playlist, channel.header.author))
        this.playlistContinuationData = playlistsTab.has_continuation ? playlistsTab : null
        this.isElementListLoading = false
      } catch (err) {
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
      }
    },

    getChannelPlaylistsLocalMore: async function () {
      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').ChannelListContinuation}
         */
        const continuation = await this.playlistContinuationData.getContinuation()

        const parsedPlaylists = continuation.playlists.map(playlist => parseLocalListPlaylist(playlist, this.channelInstance.header.author))
        this.latestPlaylists = this.latestPlaylists.concat(parsedPlaylists)
        this.playlistContinuationData = continuation.has_continuation ? continuation : null
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      }
    },

    getPlaylistsInvidious: function () {
      this.isElementListLoading = true
      const payload = {
        resource: 'channels/playlists',
        id: this.id,
        params: {
          sort_by: this.playlistSortBy
        }
      }

      invidiousAPICall(payload).then((response) => {
        this.playlistContinuationData = response.continuation || null
        this.latestPlaylists = response.playlists
        this.isElementListLoading = false
      }).catch(async (err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          if (!this.channelInstance) {
            this.channelInstance = await getLocalChannel(this.id)
          }
          this.getChannelPlaylistsLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistsInvidiousMore: function () {
      if (this.playlistContinuationData === null) {
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

      if (this.playlistContinuationData) {
        payload.params.continuation = this.playlistContinuationData
      }

      invidiousAPICall(payload).then((response) => {
        this.playlistContinuationData = response.continuation || null
        this.latestPlaylists = this.latestPlaylists.concat(response.playlists)
        this.isElementListLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.getChannelLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    getCommunityPostsLocal: async function () {
      const expectedId = this.id

      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').default}
         */
        const channel = this.channelInstance

        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').default|import('youtubei.js/dist/src/parser/youtube/Channel').ChannelListContinuation}
         */
        let communityTab = await channel.getCommunity()
        if (expectedId !== this.id) {
          return
        }

        // work around YouTube bug where it will return a bunch of responses with only continuations in them
        // e.g. https://www.youtube.com/@TheLinuxEXP/community

        let posts = communityTab.posts
        while (posts.length === 0 && communityTab.has_continuation) {
          communityTab = await communityTab.getContinuation()
          posts = communityTab.posts
        }

        this.latestCommunityPosts = posts.map(parseLocalCommunityPost)
        this.communityContinuationData = communityTab.has_continuation ? communityTab : null
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getCommunityPostsInvidious()
        } else {
          this.isLoading = false
        }
      }
    },

    getCommunityPostsLocalMore: async function () {
      try {
        /**
         * @type {import('youtubei.js/dist/src/parser/youtube/Channel').ChannelListContinuation}
         */
        let continuation = await this.communityContinuationData.getContinuation()

        // work around YouTube bug where it will return a bunch of responses with only continuations in them
        // e.g. https://www.youtube.com/@TheLinuxEXP/community
        let posts = continuation.posts
        while (posts.length === 0 && continuation.has_continuation) {
          continuation = await continuation.getContinuation()
          posts = continuation.posts
        }

        this.latestCommunityPosts = this.latestCommunityPosts.concat(posts.map(parseLocalCommunityPost))
        this.communityContinuationData = continuation.has_continuation ? continuation : null
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      }
    },

    getCommunityPostsInvidious: function() {
      invidiousGetCommunityPosts(this.id).then(posts => {
        this.latestCommunityPosts = posts
      }).catch(async (err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          if (!this.channelInstance) {
            this.channelInstance = await getLocalChannel(this.id)
          }
          this.getCommunityPostsLocal()
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

    setErrorMessage: function (errorMessage, responseHasNameAndThumbnail = false) {
      this.isLoading = false
      this.errorMessage = errorMessage

      if (!responseHasNameAndThumbnail) {
        this.channelName = this.subscriptionInfo?.name
        this.thumbnailUrl = this.subscriptionInfo?.thumbnail
      }
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
              this.channelInvidiousVideos()
              break
          }
          break
        case 'live':
          switch (this.apiUsed) {
            case 'local':
              this.getChannelLiveLocalMore()
              break
            case 'invidious':
              this.channelInvidiousLive()
              break
          }
          break
        case 'playlists':
          switch (this.apiUsed) {
            case 'local':
              this.getChannelPlaylistsLocalMore()
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
        case 'community':
          switch (this.apiUsed) {
            case 'local':
              this.getCommunityPostsLocalMore()
              break
            case 'invidious':
              // not supported by invidious yet...
              // this.getCommunityPostsInvidiousMore()
              break
          }
          break
        default:
          console.error(this.currentTab)
      }
    },

    changeTab: function (tab, event) {
      if (event instanceof KeyboardEvent) {
        if (event.altKey) {
          return
        }

        // use arrowkeys to navigate
        event.preventDefault()
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          const index = this.tabInfoValues.indexOf(tab)

          // focus left or right tab with wrap around
          tab = (event.key === 'ArrowLeft')
            ? this.tabInfoValues[(index > 0 ? index : this.tabInfoValues.length) - 1]
            : this.tabInfoValues[(index + 1) % this.tabInfoValues.length]

          const tabNode = document.getElementById(`${tab}Tab`)
          event.target.setAttribute('tabindex', '-1')
          tabNode.setAttribute('tabindex', 0)
          tabNode.focus({ focusVisible: true })
          return
        }
      }

      // `currentTabNode` can be `null` on 2nd+ search
      const currentTabNode = document.querySelector('.tabs > .tab[aria-selected="true"]')
      // `newTabNode` can be `null` when `tab` === "search"
      const newTabNode = document.getElementById(`${tab}Tab`)
      document.querySelector('.tabs > .tab[tabindex="0"]')?.setAttribute('tabindex', '-1')
      newTabNode?.setAttribute('tabindex', '0')
      currentTabNode?.setAttribute('aria-selected', 'false')
      newTabNode?.setAttribute('aria-selected', 'true')
      this.currentTab = tab
      newTabNode?.focus({ focusVisible: true })
    },

    newSearch: function (query) {
      this.lastSearchQuery = query
      this.searchContinuationData = null
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

    searchChannelLocal: async function () {
      const isNewSearch = this.searchContinuationData === null
      try {
        let result
        let contents
        if (isNewSearch) {
          if (!this.channelInstance.has_search) {
            showToast(this.$t('Channel.This channel does not allow searching'), 5000)
            this.showSearchBar = false
            return
          }
          result = await this.channelInstance.search(this.lastSearchQuery)
          contents = result.current_tab.content.contents
        } else {
          result = await this.searchContinuationData.getContinuation()
          contents = result.contents.contents
        }

        const results = contents
          .filter(node => node.type === 'ItemSection')
          .flatMap(itemSection => itemSection.contents)
          .filter(item => item.type === 'Video' || item.type === 'Playlist')
          .map(item => {
            if (item.type === 'Video') {
              return parseLocalListVideo(item)
            } else {
              return parseLocalListPlaylist(item, this.channelInstance.header.author)
            }
          })

        if (isNewSearch) {
          this.searchResults = results
        } else {
          this.searchResults = this.searchResults.concat(results)
        }

        this.searchContinuationData = result.has_continuation ? result : null
        this.isElementListLoading = false
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (isNewSearch) {
          if (this.backendPreference === 'local' && this.backendFallback) {
            showToast(this.$t('Falling back to Invidious API'))
            this.searchChannelInvidious()
          } else {
            this.isLoading = false
          }
        }
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

      invidiousAPICall(payload).then((response) => {
        this.searchResults = this.searchResults.concat(response)
        this.isElementListLoading = false
        this.searchPage++
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.searchChannelLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    ...mapActions([
      'updateProfile',
      'updateSubscriptionDetails'
    ])
  }
})
