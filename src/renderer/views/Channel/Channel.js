import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtAgeRestricted from '../../components/ft-age-restricted/ft-age-restricted.vue'
import FtShareButton from '../../components/ft-share-button/ft-share-button.vue'
import FtSubscribeButton from '../../components/ft-subscribe-button/ft-subscribe-button.vue'
import ChannelAbout from '../../components/channel-about/channel-about.vue'

import autolinker from 'autolinker'
import { copyToClipboard, extractNumberFromString, formatNumber, showToast } from '../../helpers/utils'
import { isNullOrEmpty } from '../../helpers/strings'
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
  parseLocalChannelShorts,
  parseLocalChannelVideos,
  parseLocalCommunityPosts,
  parseLocalListPlaylist,
  parseLocalListVideo,
  parseLocalSubscriberCount
} from '../../helpers/api/local'
import { Injectables } from '../../../constants'

export default defineComponent({
  name: 'Channel',
  components: {
    'ft-card': FtCard,
    'ft-input': FtInput,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList,
    'ft-age-restricted': FtAgeRestricted,
    'ft-share-button': FtShareButton,
    'ft-subscribe-button': FtSubscribeButton,
    'channel-about': ChannelAbout
  },
  inject: {
    showOutlines: Injectables.SHOW_OUTLINES
  },
  data: function () {
    return {
      isLoading: false,
      isElementListLoading: false,
      currentTab: 'videos',
      id: '',
      /** @type {import('youtubei.js').YT.Channel|null} */
      channelInstance: null,
      channelName: '',
      bannerUrl: '',
      thumbnailUrl: '',
      subCount: 0,
      searchPage: 2,
      videoContinuationData: null,
      shortContinuationData: null,
      liveContinuationData: null,
      releaseContinuationData: null,
      podcastContinuationData: null,
      playlistContinuationData: null,
      searchContinuationData: null,
      communityContinuationData: null,
      description: '',
      tags: [],
      views: 0,
      joined: 0,
      location: null,
      videoSortBy: 'newest',
      shortSortBy: 'newest',
      liveSortBy: 'newest',
      playlistSortBy: 'newest',
      showVideoSortBy: true,
      showShortSortBy: true,
      showLiveSortBy: true,
      showPlaylistSortBy: true,
      lastSearchQuery: '',
      relatedChannels: [],
      latestVideos: [],
      latestShorts: [],
      latestLive: [],
      latestReleases: [],
      latestPodcasts: [],
      latestPlaylists: [],
      latestCommunityPosts: [],
      searchResults: [],
      shownElementList: [],
      apiUsed: '',
      isFamilyFriendly: false,
      errorMessage: '',
      showSearchBar: true,
      showShareMenu: true,
      videoLiveSelectValues: [
        'newest',
        'popular',
        'oldest'
      ],
      shortSelectValues: [
        'newest',
        'popular'
      ],
      playlistSelectValues: [
        'newest',
        'last'
      ],

      autoRefreshOnSortByChangeEnabled: false,
      supportedChannelTabs: [
        'videos',
        'shorts',
        'live',
        'releases',
        'podcasts',
        'playlists',
        'community',
        'about'
      ],
      channelTabs: [
        'videos',
        'shorts',
        'live',
        'releases',
        'podcasts',
        'playlists',
        'community',
        'about'
      ]
    }
  },
  computed: {
    backendPreference: function () {
      let preference = this.$store.getters.getBackendPreference
      if (preference === 'piped') {
        preference = this.$store.getters.getFallbackPreference
      }
      return preference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback && this.$store.getters.getBackendPreference !== 'piped'
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

    videoLiveSelectNames: function () {
      return [
        this.$t('Channel.Videos.Sort Types.Newest'),
        this.$t('Channel.Videos.Sort Types.Most Popular'),
        this.$t('Channel.Videos.Sort Types.Oldest')
      ]
    },

    shortSelectNames: function () {
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

    showFetchMoreButton: function () {
      switch (this.currentTab) {
        case 'videos':
          return !isNullOrEmpty(this.videoContinuationData)
        case 'shorts':
          return !isNullOrEmpty(this.shortContinuationData)
        case 'live':
          return !isNullOrEmpty(this.liveContinuationData)
        case 'releases':
          return !isNullOrEmpty(this.releaseContinuationData)
        case 'podcasts':
          return !isNullOrEmpty(this.podcastContinuationData)
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

    hideSharingActions: function () {
      return this.$store.getters.getHideSharingActions
    },

    hideChannelShorts: function () {
      return this.$store.getters.getHideChannelShorts
    },

    hideLiveStreams: function () {
      return this.$store.getters.getHideLiveStreams
    },

    hideChannelPodcasts: function() {
      return this.$store.getters.getHideChannelPodcasts
    },

    hideChannelReleases: function() {
      return this.$store.getters.getHideChannelReleases
    },

    hideChannelPlaylists: function() {
      return this.$store.getters.getHideChannelPlaylists
    },

    hideChannelCommunity: function() {
      return this.$store.getters.getHideChannelCommunity
    },

    tabInfoValues: function () {
      const values = [...this.channelTabs]

      const indexToRemove = []
      // remove tabs from the array based on user settings
      if (this.hideChannelShorts) {
        indexToRemove.push(values.indexOf('shorts'))
      }

      if (this.hideLiveStreams) {
        indexToRemove.push(values.indexOf('live'))
      }

      if (this.hideChannelPlaylists) {
        indexToRemove.push(values.indexOf('playlists'))
      }

      if (this.hideChannelCommunity) {
        indexToRemove.push(values.indexOf('community'))
      }

      if (this.hideChannelPodcasts) {
        indexToRemove.push(values.indexOf('podcasts'))
      }

      if (this.hideChannelReleases) {
        indexToRemove.push(values.indexOf('releases'))
      }

      indexToRemove.forEach(index => {
        if (index !== -1) {
          values.splice(index, 1)
        }
      })

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

      // Disable auto refresh on sort value change during state reset
      this.autoRefreshOnSortByChangeEnabled = false

      this.id = this.$route.params.id
      this.searchPage = 2
      this.relatedChannels = []
      this.latestVideos = []
      this.latestShorts = []
      this.latestLive = []
      this.videoSortBy = 'newest'
      this.shortSortBy = 'newest'
      this.liveSortBy = 'newest'
      this.playlistSortBy = 'newest'
      this.latestPlaylists = []
      this.latestPodcasts = []
      this.latestReleases = []
      this.latestCommunityPosts = []
      this.searchResults = []
      this.shownElementList = []
      this.apiUsed = ''
      this.channelInstance = ''
      this.videoContinuationData = null
      this.shortContinuationData = null
      this.liveContinuationData = null
      this.playlistContinuationData = null
      this.podcastContinuationData = null
      this.releaseContinuationData = null
      this.searchContinuationData = null
      this.communityContinuationData = null
      this.showSearchBar = true
      this.showVideoSortBy = true
      this.showShortSortBy = true
      this.showLiveSortBy = true
      this.showPlaylistSortBy = true

      this.currentTab = this.currentOrFirstTab(this.$route.params.currentTab)

      if (this.id === '@@@') {
        this.showShareMenu = false
        this.setErrorMessage(this.$i18n.t('Channel.This channel does not exist'))
        return
      }

      this.showShareMenu = true
      this.errorMessage = ''

      // Re-enable auto refresh on sort value change AFTER update done
      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        this.getChannelInfoInvidious()
        this.autoRefreshOnSortByChangeEnabled = true
      } else {
        this.getChannelLocal().finally(() => {
          this.autoRefreshOnSortByChangeEnabled = true
        })
      }
    },

    videoSortBy () {
      if (!this.autoRefreshOnSortByChangeEnabled) { return }

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

    shortSortBy() {
      if (!this.autoRefreshOnSortByChangeEnabled) { return }

      this.isElementListLoading = true
      this.latestShorts = []
      switch (this.apiUsed) {
        case 'local':
          this.getChannelShortsLocal()
          break
        case 'invidious':
          this.channelInvidiousShorts(true)
          break
        default:
          this.getChannelShortsLocal()
      }
    },

    liveSortBy () {
      if (!this.autoRefreshOnSortByChangeEnabled) { return }

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
      if (!this.autoRefreshOnSortByChangeEnabled) { return }

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

    this.currentTab = this.currentOrFirstTab(this.$route.params.currentTab)

    if (this.id === '@@@') {
      this.showShareMenu = false
      this.setErrorMessage(this.$i18n.t('Channel.This channel does not exist'))
      return
    }

    // Enable auto refresh on sort value change AFTER initial update done
    if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
      this.getChannelInfoInvidious()
      this.autoRefreshOnSortByChangeEnabled = true
    } else {
      this.getChannelLocal().finally(() => {
        this.autoRefreshOnSortByChangeEnabled = true
      })
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

    currentOrFirstTab: function (currentTab) {
      if (this.tabInfoValues.includes(currentTab)) {
        return currentTab
      }

      return this.tabInfoValues[0]
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
          /** @type {import('youtubei.js').YTNodes.ChannelAgeGate} */
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
             * @type {import('youtubei.js').YTNodes.C4TabbedHeader}
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
             * @type {import('youtubei.js').YTNodes.CarouselHeader}
             */
            const header = channel.header

            /**
             * @type {import('youtubei.js').YTNodes.TopicChannelDetails}
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
             * @type {import('youtubei.js').YTNodes.InteractiveTabbedHeader}
             */
            const header = channel.header
            channelName = header.title.text
            channelId = this.id
            channelThumbnailUrl = header.box_art.at(-1).url

            const badges = header.badges.map(badge => badge.label).filter(tag => tag)
            tags.push(...badges)
            break
          }
          case 'PageHeader': {
            // example: YouTube Gaming (an A/B test at the time of writing)
            // https://www.youtube.com/channel/UCOpNcN46UbXVtpKMrmU4Abg

            /**
             * @type {import('youtubei.js').YTNodes.PageHeader}
             */
            const header = channel.header

            channelName = header.content.title.text
            channelThumbnailUrl = header.content.image.image[0].url
            channelId = this.id

            break
          }
        }

        if (channelThumbnailUrl.startsWith('//')) {
          channelThumbnailUrl = `https:${channelThumbnailUrl}`
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

        if (subscriberText) {
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
        const tabs = ['about']

        if (channel.has_videos) {
          tabs.push('videos')
          this.getChannelVideosLocal()
        }

        if (!this.hideChannelShorts && channel.has_shorts) {
          tabs.push('shorts')
          this.getChannelShortsLocal()
        }

        if (!this.hideLiveStreams && channel.has_live_streams) {
          tabs.push('live')
          this.getChannelLiveLocal()
        }

        if (!this.hideChannelPodcasts && channel.has_podcasts) {
          tabs.push('podcasts')
          this.getChannelPodcastsLocal()
        }

        if (!this.hideChannelReleases && channel.has_releases) {
          tabs.push('releases')
          this.getChannelReleasesLocal()
        }

        if (!this.hideChannelPlaylists && channel.has_playlists) {
          tabs.push('playlists')
          this.getChannelPlaylistsLocal()
        }

        if (!this.hideChannelCommunity && channel.has_community) {
          tabs.push('community')
          this.getCommunityPostsLocal()
        }

        this.channelTabs = this.supportedChannelTabs.filter(tab => {
          return tabs.includes(tab)
        })

        this.currentTab = this.currentOrFirstTab(this.$route.params.currentTab)
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
         * @type {import('youtubei.js').YT.Channel}
        */
        const channel = this.channelInstance
        const about = await channel.getAbout()

        this.description = about.description.isEmpty() ? '' : autolinker.link(about.description.text)

        const views = extractNumberFromString(about.view_count.text)
        this.views = isNaN(views) ? null : views

        this.joined = about.joined_date.isEmpty() ? 0 : new Date(about.joined_date.text.replace('Joined').trim())

        this.location = about.country.isEmpty() ? null : about.country.text
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
         * @type {import('youtubei.js').YT.Channel}
        */
        const channel = this.channelInstance
        let videosTab = await channel.getVideos()

        this.showVideoSortBy = videosTab.filters.length > 1

        if (this.showVideoSortBy && this.videoSortBy !== 'newest') {
          const index = this.videoLiveSelectValues.indexOf(this.videoSortBy)
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
         * @type {import('youtubei.js').YT.ChannelListContinuation|import('youtubei.js').YT.FilteredChannelList}
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

    getChannelShortsLocal: async function () {
      this.isElementListLoading = true
      const expectedId = this.id

      try {
        /**
         * @type {import('youtubei.js').YT.Channel}
         */
        const channel = this.channelInstance
        let shortsTab = await channel.getShorts()

        this.showShortSortBy = shortsTab.filters.length > 1

        if (this.showShortSortBy && this.shortSortBy !== 'newest') {
          const index = this.shortSelectValues.indexOf(this.shortSortBy)
          shortsTab = await shortsTab.applyFilter(shortsTab.filters[index])
        }

        if (expectedId !== this.id) {
          return
        }

        this.latestShorts = parseLocalChannelShorts(shortsTab.videos, channel.header.author)
        this.shortContinuationData = shortsTab.has_continuation ? shortsTab : null
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

    getChannelShortsLocalMore: async function () {
      try {
        /**
         * @type {import('youtubei.js').YT.ChannelListContinuation|import('youtubei.js').YT.FilteredChannelList}
         */
        const continuation = await this.shortContinuationData.getContinuation()

        this.latestShorts.push(...parseLocalChannelShorts(continuation.videos, this.channelInstance.header.author))
        this.shortContinuationData = continuation.has_continuation ? continuation : null
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
         * @type {import('youtubei.js').YT.Channel}
        */
        const channel = this.channelInstance
        let liveTab = await channel.getLiveStreams()

        this.showLiveSortBy = liveTab.filters.length > 1

        if (this.showLiveSortBy && this.liveSortBy !== 'newest') {
          const index = this.videoLiveSelectValues.indexOf(this.liveSortBy)
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
         * @type {import('youtubei.js').YT.ChannelListContinuation|import('youtubei.js').YT.FilteredChannelList}
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
        this.subCount = response.subCount
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

        const tabs = response.tabs.map(tab => {
          if (tab === 'streams') {
            return 'live'
          }
          return tab
        })

        this.channelTabs = this.supportedChannelTabs.filter(tab => {
          return tabs.includes(tab)
        })

        this.currentTab = this.currentOrFirstTab(this.$route.params.currentTab)

        if (response.tabs.includes('videos')) {
          this.channelInvidiousVideos()
        }

        if (!this.hideChannelShorts && response.tabs.includes('shorts')) {
          this.channelInvidiousShorts()
        }

        if (!this.hideLiveStreams && response.tabs.includes('streams')) {
          this.channelInvidiousLive()
        }

        if (!this.hideChannelPodcasts && response.tabs.includes('podcasts')) {
          this.channelInvidiousPodcasts()
        }

        if (!this.hideChannelReleases && response.tabs.includes('releases')) {
          this.channelInvidiousReleases()
        }

        if (!this.hideChannelPlaylists && response.tabs.includes('playlists')) {
          this.getPlaylistsInvidious()
        }

        if (!this.hideChannelCommunity && response.tabs.includes('community')) {
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
        resource: 'channels',
        id: this.id,
        subResource: 'videos',
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

    channelInvidiousShorts: function (sortByChanged) {
      const payload = {
        resource: 'channels',
        id: this.id,
        subResource: 'shorts',
        params: {
          sort_by: this.shortSortBy,
        }
      }

      if (sortByChanged) {
        this.shortContinuationData = null
      }

      let more = false
      if (this.shortContinuationData) {
        payload.params.continuation = this.shortContinuationData
        more = true
      }

      if (!more) {
        this.isElementListLoading = true
      }

      invidiousAPICall(payload).then((response) => {
        // workaround for Invidious sending incorrect information
        // https://github.com/iv-org/invidious/issues/3801
        response.videos.forEach(video => {
          video.isUpcoming = false
          delete video.publishedText
          delete video.premiereTimestamp
        })

        if (more) {
          this.latestShorts.push(...response.videos)
        } else {
          this.latestShorts = response.videos
        }
        this.shortContinuationData = response.continuation || null
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
         * @type {import('youtubei.js').YT.Channel}
         */
        const channel = this.channelInstance
        let playlistsTab = await channel.getPlaylists()

        // some channels have more categories of playlists than just "Created Playlists" e.g. https://www.youtube.com/channel/UCez-2shYlHQY3LfILBuDYqQ
        // for the moment we just want the "Created Playlists" category that has all playlists in it

        if (playlistsTab.content_type_filters.length > 1) {
          let viewId = '1'

          // Artist topic channels don't have any created playlists, so we went to select the "Albums & Singles" category instead
          if (this.channelName.endsWith('- Topic') && channel.metadata.music_artist_name) {
            viewId = '50'
          }

          /**
           * @type {import('youtubei.js').YTNodes.ChannelSubMenu}
           */
          const menu = playlistsTab.current_tab.content.sub_menu
          const createdPlaylistsFilter = menu.content_type_sub_menu_items.find(contentType => {
            const url = `https://youtube.com/${contentType.endpoint.metadata.url}`
            return new URL(url).searchParams.get('view') === viewId
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
         * @type {import('youtubei.js').YT.ChannelListContinuation}
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
        resource: 'channels',
        subResource: 'playlists',
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
        resource: 'channels',
        subResource: 'playlists',
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

    getChannelReleasesLocal: async function () {
      this.isElementListLoading = true
      const expectedId = this.id

      try {
        /**
         * @type {import('youtubei.js').YT.Channel}
        */
        const channel = this.channelInstance
        const releaseTab = await channel.getReleases()

        if (expectedId !== this.id) {
          return
        }

        this.latestReleases = releaseTab.playlists.map(playlist => parseLocalListPlaylist(playlist, channel.header.author))
        this.releaseContinuationData = releaseTab.has_continuation ? releaseTab : null
        this.isElementListLoading = false
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getChannelReleasesInvidious()
        } else {
          this.isLoading = false
        }
      }
    },

    getChannelReleasesLocalMore: async function () {
      try {
        /**
         * @type {import('youtubei.js').YT.ChannelListContinuation}
         */
        const continuation = await this.releaseContinuationData.getContinuation()

        const parsedReleases = continuation.playlists.map(playlist => parseLocalListPlaylist(playlist, this.channelInstance.header.author))
        this.latestReleases = this.latestReleases.concat(parsedReleases)
        this.releaseContinuationData = continuation.has_continuation ? continuation : null
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      }
    },

    channelInvidiousReleases: function() {
      this.isElementListLoading = true
      const payload = {
        resource: 'channels',
        subResource: 'releases',
        id: this.id,
      }

      invidiousAPICall(payload).then((response) => {
        this.releaseContinuationData = response.continuation || null
        this.latestReleases = response.playlists
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
          this.getChannelReleasesLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    channelInvidiousReleasesMore: function () {
      if (this.releaseContinuationData === null) {
        console.warn('There are no more podcasts available for this channel')
        return
      }

      const payload = {
        resource: 'channels',
        subResource: 'releases',
        id: this.id
      }

      invidiousAPICall(payload).then((response) => {
        this.releaseContinuationData = response.continuation || null
        this.latestReleases = this.latestReleases.concat(response.playlists)
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

    getChannelPodcastsLocal: async function () {
      this.isElementListLoading = true
      const expectedId = this.id

      try {
        /**
         * @type {import('youtubei.js').YT.Channel}
        */
        const channel = this.channelInstance
        const podcastTab = await channel.getPodcasts()

        if (expectedId !== this.id) {
          return
        }

        this.latestPodcasts = podcastTab.playlists.map(playlist => parseLocalListPlaylist(playlist, channel.header.author))
        this.podcastContinuationData = podcastTab.has_continuation ? podcastTab : null
        this.isElementListLoading = false
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getChannelPodcastsInvidious()
        } else {
          this.isLoading = false
        }
      }
    },

    getChannelPodcastsLocalMore: async function () {
      try {
        /**
         * @type {import('youtubei.js').YT.ChannelListContinuation}
         */
        const continuation = await this.podcastContinuationData.getContinuation()

        const parsedPodcasts = continuation.playlists.map(playlist => parseLocalListPlaylist(playlist, this.channelInstance.header.author))
        this.latestPodcasts = this.latestPodcasts.concat(parsedPodcasts)
        this.releaseContinuationData = continuation.has_continuation ? continuation : null
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
      }
    },

    channelInvidiousPodcasts: function() {
      this.isElementListLoading = true
      const payload = {
        resource: 'channels',
        subResource: 'podcasts',
        id: this.id,
      }

      invidiousAPICall(payload).then((response) => {
        this.podcastContinuationData = response.continuation || null
        this.latestPodcasts = response.playlists
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
          this.getChannelPodcastsLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    channelInvidiousPodcastsMore: function () {
      if (this.podcastContinuationData === null) {
        console.warn('There are no more podcasts available for this channel')
        return
      }

      const payload = {
        resource: 'channels',
        subResource: 'podcasts',
        id: this.id
      }

      invidiousAPICall(payload).then((response) => {
        this.podcastContinuationData = response.continuation || null
        this.latestPodcasts = this.latestPodcasts.concat(response.playlists)
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
         * @type {import('youtubei.js').YT.Channel}
         */
        const channel = this.channelInstance

        /**
         * @type {import('youtubei.js').YT.Channel|import('youtubei.js').YT.ChannelListContinuation}
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

        this.latestCommunityPosts = parseLocalCommunityPosts(posts)
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
         * @type {import('youtubei.js').YT.ChannelListContinuation}
         */
        let continuation = await this.communityContinuationData.getContinuation()

        // work around YouTube bug where it will return a bunch of responses with only continuations in them
        // e.g. https://www.youtube.com/@TheLinuxEXP/community
        let posts = continuation.posts
        while (posts.length === 0 && continuation.has_continuation) {
          continuation = await continuation.getContinuation()
          posts = continuation.posts
        }

        this.latestCommunityPosts = this.latestCommunityPosts.concat(parseLocalCommunityPosts(posts))
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
      const more = !isNullOrEmpty(this.communityContinuationData)

      invidiousGetCommunityPosts(this.id, this.communityContinuationData).then(({ posts, continuation }) => {
        if (more) {
          this.latestCommunityPosts.push(...posts)
        } else {
          this.latestCommunityPosts = posts
        }
        this.communityContinuationData = continuation
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
        case 'shorts':
          switch (this.apiUsed) {
            case 'local':
              this.getChannelShortsLocalMore()
              break
            case 'invidious':
              this.channelInvidiousShorts()
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
        case 'releases':
          this.getChannelReleasesLocalMore()
          break
        case 'podcasts':
          this.getChannelPodcastsLocalMore()
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
              this.getCommunityPostsInvidious()
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
          tabNode.focus()
          this.showOutlines()
          return
        }
      }

      // `newTabNode` can be `null` when `tab` === "search"
      const newTabNode = document.getElementById(`${tab}Tab`)
      this.currentTab = tab
      newTabNode?.focus()
      this.showOutlines()
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
        resource: 'channels',
        id: this.id,
        subResource: 'search',
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
      'updateSubscriptionDetails'
    ])
  }
})
