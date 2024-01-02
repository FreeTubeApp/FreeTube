import { defineComponent } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions, mapGetters } from 'vuex'
import {
  formatDurationAsTimestamp,
  formatNumber,
  showToast,
  toLocalePublicationString,
  toDistractionFreeTitle,
  getVideoDropdownOptions,
  handleVideoDropdownOptionsClick
} from '../../helpers/utils'
import { deArrowData } from '../../helpers/sponsorblock'

export default defineComponent({
  name: 'FtListVideo',
  components: {
    'ft-icon-button': FtIconButton
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    playlistId: {
      type: String,
      default: null
    },
    playlistIndex: {
      type: Number,
      default: null
    },
    playlistReverse: {
      type: Boolean,
      default: false
    },
    playlistShuffle: {
      type: Boolean,
      default: false
    },
    playlistLoop: {
      type: Boolean,
      default: false
    },
    forceListType: {
      type: String,
      default: null
    },
    appearance: {
      type: String,
      required: true
    },
    showVideoWithLastViewedPlaylist: {
      type: Boolean,
      default: false
    },
  },
  data: function () {
    return {
      id: '',
      title: '',
      channelName: null,
      channelId: null,
      viewCount: 0,
      parsedViewCount: '',
      uploadedTime: '',
      lengthSeconds: 0,
      duration: '',
      description: '',
      watched: false,
      watchProgress: 0,
      publishedText: '',
      isLive: false,
      isUpcoming: false,
      isPremium: false,
      hideViews: false,
      selectionModeSelectionId: 0
    }
  },
  computed: {
    ...mapGetters([
      'getIsIndexSelectedInSelectionMode'
    ]),

    historyEntry: function () {
      return this.$store.getters.getHistoryCacheById[this.id]
    },

    historyEntryExists: function () {
      return typeof this.historyEntry !== 'undefined'
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    blurThumbnails: function () {
      return this.$store.getters.getBlurThumbnails
    },

    blurThumbnailsStyle: function () {
      return this.blurThumbnails ? 'blur(20px)' : null
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    inHistory: function () {
      // When in the history page, showing relative dates isn't very useful.
      // We want to show the exact date instead
      return this.$route.name === 'history'
    },

    invidiousUrl: function () {
      let videoUrl = `${this.currentInvidiousInstance}/watch?v=${this.id}`
      // `playlistId` can be undefined
      if (this.playlistIdFinal && this.playlistIdFinal.length !== 0) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistIdFinal}`
      }
      return videoUrl
    },

    invidiousChannelUrl: function () {
      return `${this.currentInvidiousInstance}/channel/${this.channelId}`
    },

    youtubeUrl: function () {
      let videoUrl = `https://www.youtube.com/watch?v=${this.id}`
      // `playlistId` can be undefined
      if (this.playlistIdFinal && this.playlistIdFinal.length !== 0) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistIdFinal}`
      }
      return videoUrl
    },

    youtubeShareUrl: function () {
      // `playlistId` can be undefined
      if (this.playlistIdFinal && this.playlistIdFinal.length !== 0) {
        // `index` seems can be ignored
        return `https://youtu.be/${this.id}?list=${this.playlistIdFinal}`
      }
      return `https://youtu.be/${this.id}`
    },

    youtubeChannelUrl: function () {
      return `https://youtube.com/channel/${this.channelId}`
    },

    youtubeEmbedUrl: function () {
      return `https://www.youtube-nocookie.com/embed/${this.id}`
    },

    progressPercentage: function () {
      if (typeof this.lengthSeconds !== 'number') {
        return 0
      }

      return (this.watchProgress / this.lengthSeconds) * 100
    },

    hideSharingActions: function() {
      return this.$store.getters.getHideSharingActions
    },

    dropdownOptions: function () {
      return getVideoDropdownOptions(...this.videoDropdownOptionArguments)
    },

    thumbnail: function () {
      let baseUrl
      if (this.backendPreference === 'invidious') {
        baseUrl = this.currentInvidiousInstance
      } else {
        baseUrl = 'https://i.ytimg.com'
      }

      switch (this.thumbnailPreference) {
        case 'start':
          return `${baseUrl}/vi/${this.id}/mq1.jpg`
        case 'middle':
          return `${baseUrl}/vi/${this.id}/mq2.jpg`
        case 'end':
          return `${baseUrl}/vi/${this.id}/mq3.jpg`
        case 'hidden':
          return require('../../assets/img/thumbnail_placeholder.svg')
        default:
          return `${baseUrl}/vi/${this.id}/mqdefault.jpg`
      }
    },

    hideVideoViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    addWatchedStyle: function () {
      return this.watched && !this.inHistory
    },

    favoritesPlaylist: function () {
      return this.$store.getters.getFavorites
    },

    inFavoritesPlaylist: function () {
      const index = this.favoritesPlaylist.videos.findIndex((video) => {
        return video.videoId === this.id
      })

      return index !== -1
    },

    favoriteIconTheme: function () {
      return this.inFavoritesPlaylist ? 'base favorite' : 'base'
    },

    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },

    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
    },

    saveWatchedProgress: function () {
      return this.$store.getters.getSaveWatchedProgress
    },

    saveVideoHistoryWithLastViewedPlaylist: function () {
      return this.$store.getters.getSaveVideoHistoryWithLastViewedPlaylist
    },

    showDistractionFreeTitles: function () {
      return this.$store.getters.getShowDistractionFreeTitles
    },

    displayTitle: function () {
      let title
      if (this.useDeArrowTitles && this.deArrowCache?.title) {
        title = this.deArrowCache.title
      } else {
        title = this.title
      }

      if (this.showDistractionFreeTitles) {
        return toDistractionFreeTitle(title)
      } else {
        return title
      }
    },

    playlistIdFinal: function () {
      if (this.playlistId) {
        return this.playlistId
      }

      // Get playlist ID from history ONLY if option enabled
      if (!this.showVideoWithLastViewedPlaylist) { return }
      if (!this.saveVideoHistoryWithLastViewedPlaylist) { return }

      return this.historyEntry?.lastViewedPlaylistId
    },

    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },

    useDeArrowTitles: function () {
      return this.$store.getters.getUseDeArrowTitles
    },

    deArrowCache: function () {
      return this.$store.getters.getDeArrowCache[this.id]
    },

    isSelectionModeEnabled: function () {
      return this.$store.getters.getIsSelectionModeEnabled
    },

    selectAllInSelectionModeTriggered: function () {
      return this.$store.getters.getSelectAllInSelectionModeTriggered
    },

    unselectAllInSelectionModeTriggered: function () {
      return this.$store.getters.getUnselectAllInSelectionModeTriggered
    },

    videoDropdownOptionArguments: function () {
      const count = 1
      const videoComponents = [this]
      const videosWithChannelIdsCount = this.channelId !== null ? 1 : 0

      const watchedVideosCount = this.watched ? 1 : 0
      const unwatchedVideosCount = count - watchedVideosCount

      const savedVideosCount = this.inFavoritesPlaylist ? 1 : 0
      const unsavedVideosCount = count - savedVideosCount

      const channelsHidden = JSON.parse(this.$store.getters.getChannelsHidden)
      const hiddenChannels = new Set()
      const unhiddenChannels = new Set()
      if (channelsHidden.includes(this.channelId)) {
        hiddenChannels.add(this.channelId)
      } else {
        unhiddenChannels.add(this.channelId)
      }

      return [
        count,
        watchedVideosCount,
        unwatchedVideosCount,
        savedVideosCount,
        unsavedVideosCount,
        videosWithChannelIdsCount,
        hiddenChannels,
        unhiddenChannels,
        videoComponents
      ]
    }
  },
  watch: {
    historyEntry() {
      this.checkIfWatched()
    },
    selectAllInSelectionModeTriggered() {
      if (this.selectionModeSelectionId === 0) {
        this.addToOrRemoveFromSelectionModeSelections()
      }
    },
    unselectAllInSelectionModeTriggered() {
      this.selectionModeSelectionId = 0
    }
  },
  created: function () {
    this.parseVideoData()
    this.checkIfWatched()

    if (this.useDeArrowTitles && !this.deArrowCache) {
      this.fetchDeArrowData()
    }
  },
  beforeDestroy: function () {
    if (this.selectionModeSelectionId) {
      this.removeFromSelectionModeSelections(this.selectionModeSelectionId)
    }
  },
  methods: {
    fetchDeArrowData: async function() {
      const videoId = this.id
      const data = await deArrowData(this.id)
      const cacheData = { videoId, title: null }
      if (Array.isArray(data?.titles) && data.titles.length > 0 && (data.titles[0].locked || data.titles[0].votes >= 0)) {
        cacheData.title = data.titles[0].title
      }

      // Save data to cache whether data available or not to prevent duplicate requests
      this.$store.commit('addVideoToDeArrowCache', cacheData)
    },

    handleExternalPlayer: function () {
      this.$emit('pause-player')

      this.openInExternalPlayer({
        watchProgress: this.watchProgress,
        playbackRate: this.defaultPlayback,
        videoId: this.id,
        videoLength: this.data.lengthSeconds,
        playlistId: this.playlistIdFinal,
        playlistIndex: this.playlistIndex,
        playlistReverse: this.playlistReverse,
        playlistShuffle: this.playlistShuffle,
        playlistLoop: this.playlistLoop
      })

      if (this.saveWatchedProgress && !this.watched) {
        this.markAsWatched()
      }
    },

    toggleSave: function () {
      if (this.inFavoritesPlaylist) {
        this.removeFromPlaylist()
      } else {
        this.addToPlaylist()
      }
    },

    setSave(willSave, hideToast = false) {
      if (!this.inFavoritesPlaylist && willSave) {
        this.addToPlaylist(hideToast)
      } else if (this.inFavoritesPlaylist && !willSave) {
        this.removeFromPlaylist(hideToast)
      }
    },

    handleOptionsClick: function (option) {
      handleVideoDropdownOptionsClick(option, ...this.videoDropdownOptionArguments,
        (channelsHidden) => this.updateChannelsHidden(channelsHidden))
    },

    parseVideoData: function () {
      this.id = this.data.videoId
      this.title = this.data.title
      // this.thumbnail = this.data.videoThumbnails[4].url

      this.channelName = this.data.author ?? null
      this.channelId = this.data.authorId ?? null

      if ((this.data.lengthSeconds === '' || this.data.lengthSeconds === '0:00') && this.historyEntryExists) {
        this.lengthSeconds = this.historyEntry.lengthSeconds
        this.duration = formatDurationAsTimestamp(this.historyEntry.lengthSeconds)
      } else {
        this.lengthSeconds = this.data.lengthSeconds
        this.duration = formatDurationAsTimestamp(this.data.lengthSeconds)
      }

      this.description = this.data.description
      this.isLive = this.data.liveNow || this.data.lengthSeconds === 'undefined'
      this.isUpcoming = this.data.isUpcoming || this.data.premiere
      this.isPremium = this.data.premium || false
      this.viewCount = this.data.viewCount

      if (typeof this.data.premiereDate !== 'undefined') {
        let premiereDate = this.data.premiereDate

        // premiereDate will be a string when the subscriptions are restored from the cache
        if (typeof premiereDate === 'string') {
          premiereDate = new Date(premiereDate)
        }
        this.publishedText = premiereDate.toLocaleString()
      } else if (typeof (this.data.premiereTimestamp) !== 'undefined') {
        this.publishedText = new Date(this.data.premiereTimestamp * 1000).toLocaleString()
      } else {
        this.publishedText = this.data.publishedText
      }

      if (this.data.isRSS && this.data.publishedDate != null && !this.isLive) {
        const now = new Date()
        // Convert from ms to second
        // For easier code interpretation the value is made to be positive
        // `publishedDate` is sometimes a string, e.g. when switched back from another view
        const publishedDate = Date.parse(this.data.publishedDate)
        let timeDiffFromNow = ((now - publishedDate) / 1000)
        let timeUnit = 'second'

        if (timeDiffFromNow > 60) {
          timeDiffFromNow /= 60
          timeUnit = 'minute'
        }

        if (timeUnit === 'minute' && timeDiffFromNow > 60) {
          timeDiffFromNow /= 60
          timeUnit = 'hour'
        }

        if (timeUnit === 'hour' && timeDiffFromNow > 24) {
          timeDiffFromNow /= 24
          timeUnit = 'day'
        }

        // Diff month might have diff no. of days
        // To ensure the display is fine we use 31
        if (timeUnit === 'day' && timeDiffFromNow > 31) {
          timeDiffFromNow /= 24
          timeUnit = 'month'
        }

        if (timeUnit === 'month' && timeDiffFromNow > 12) {
          timeDiffFromNow /= 12
          timeUnit = 'year'
        }

        // Using `Math.ceil` so that -1.x days ago displayed as 1 day ago
        // Notice that the value is turned to negative to be displayed as "ago"
        this.uploadedTime = new Intl.RelativeTimeFormat(this.currentLocale).format(Math.ceil(-timeDiffFromNow), timeUnit)
      } else if (this.publishedText && !this.isLive) {
        // produces a string according to the template in the locales string
        this.uploadedTime = toLocalePublicationString({
          publishText: this.publishedText,
          isLive: this.isLive,
          isUpcoming: this.isUpcoming,
          isRSS: this.data.isRSS
        })
      }

      if (this.hideVideoViews) {
        this.hideViews = true
      } else if (typeof (this.data.viewCount) !== 'undefined' && this.data.viewCount !== null) {
        this.parsedViewCount = formatNumber(this.data.viewCount)
      } else if (typeof (this.data.viewCountText) !== 'undefined') {
        this.parsedViewCount = this.data.viewCountText.replace(' views', '')
      } else {
        this.hideViews = true
      }
    },

    checkIfWatched: function () {
      if (this.historyEntryExists) {
        this.watched = true

        const historyEntry = this.historyEntry

        if (this.saveWatchedProgress) {
          // For UX consistency, no progress reading if writing disabled
          this.watchProgress = historyEntry.watchProgress
        }

        if (historyEntry.published !== '') {
          const videoPublished = historyEntry.published
          const videoPublishedDate = new Date(videoPublished)
          this.publishedText = videoPublishedDate.toLocaleDateString()
        } else {
          this.publishedText = ''
        }
      } else {
        this.watched = false
        this.watchProgress = 0
      }
    },

    markAsWatched: function (hideToast = false) {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        published: this.publishedText ? this.publishedText.split(',')[0] : this.publishedText,
        description: this.description,
        viewCount: this.viewCount,
        lengthSeconds: this.data.lengthSeconds,
        watchProgress: 0,
        timeWatched: new Date().getTime(),
        isLive: false,
        type: 'video'
      }
      this.updateHistory(videoData)

      if (!hideToast) {
        showToast(this.$tc('Video.Video has been marked as watched'))
      }

      this.watched = true
    },

    removeFromWatched: function (hideToast = false) {
      this.removeFromHistory(this.id)

      if (!hideToast) {
        showToast(this.$tc('Video.Video has been removed from your history'))
      }

      this.watched = false
      this.watchProgress = 0
    },

    addToPlaylist: function (hideToast = false) {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        published: '',
        description: this.description,
        viewCount: this.viewCount,
        lengthSeconds: this.data.lengthSeconds,
        timeAdded: new Date().getTime(),
        isLive: false,
        type: 'video',
      }

      const payload = {
        playlistName: 'Favorites',
        videoData: videoData
      }

      this.addVideo(payload)

      if (!hideToast) {
        showToast(this.$tc('Video.Video has been saved'))
      }
    },

    removeFromPlaylist: function (hideToast = false) {
      const payload = {
        playlistName: 'Favorites',
        videoId: this.id
      }

      this.removeVideo(payload)

      if (!hideToast) {
        showToast(this.$tc('Video.Video has been removed from your saved list'))
      }
    },

    addToOrRemoveFromSelectionModeSelections: async function () {
      if (!this.isSelectionModeEnabled) {
        return
      }

      if (!this.getIsIndexSelectedInSelectionMode(this.selectionModeSelectionId)) {
        const selectionModeSelectionId = await this.$store.dispatch('addToSelectionModeSelections', this)
        this.selectionModeSelectionId = selectionModeSelectionId
      } else {
        this.removeFromSelectionModeSelections(this.selectionModeSelectionId)
        this.selectionModeSelectionId = 0
      }
    },

    handlePointerEnter(event) {
      // only update selection if device is a pressed down mouse
      if (event.pointerType !== 'mouse' || event.pressure === 0) {
        return
      }

      this.addToOrRemoveFromSelectionModeSelections()
    },

    clearSelectionModeSelections: function () {
      this.clearSelectionModeSelections()
    },

    hideChannel: function (hiddenChannels) {
      if (!hiddenChannels.includes(this.channelId)) {
        return
      }

      hiddenChannels.push(this.channelId)
    },

    unhideChannel: function (hiddenChannels) {
      hiddenChannels = hiddenChannels.filter(c => c !== this.channelId)
    },

    ...mapActions([
      'openInExternalPlayer',
      'updateHistory',
      'removeFromHistory',
      'addVideo',
      'removeVideo',
      'clearSelectionModeSelections',
      'removeFromSelectionModeSelections',
      'updateChannelsHidden'
    ])
  }
})
