import { defineComponent } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'
import {
  copyToClipboard,
  formatDurationAsTimestamp,
  formatNumber,
  getRelativeTimeFromDate,
  openExternalLink,
  showToast,
  toDistractionFreeTitle,
  deepCopy
} from '../../helpers/utils'
import { deArrowData, deArrowThumbnail } from '../../helpers/sponsorblock'
import debounce from 'lodash.debounce'

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
    playlistType: {
      type: String,
      default: null
    },
    playlistItemId: {
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
    alwaysShowAddToPlaylistButton: {
      type: Boolean,
      default: false,
    },
    quickBookmarkButtonEnabled: {
      type: Boolean,
      default: true,
    },
    canMoveVideoUp: {
      type: Boolean,
      default: false,
    },
    canMoveVideoDown: {
      type: Boolean,
      default: false,
    },
    canRemoveFromPlaylist: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['move-video-down', 'move-video-up', 'pause-player', 'remove-from-playlist'],
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
      published: undefined,
      isLive: false,
      is4k: false,
      hasCaptions: false,
      isUpcoming: false,
      isPremium: false,
      hideViews: false,
      addToPlaylistPromptCloseCallback: null,
      debounceGetDeArrowThumbnail: null,
    }
  },
  computed: {
    historyEntry: function () {
      return this.$store.getters.getHistoryCacheById[this.id]
    },

    historyEntryExists: function () {
      return typeof this.historyEntry !== 'undefined'
    },

    watchProgress: function () {
      if (!this.historyEntryExists || !this.saveWatchedProgress) {
        return 0
      }

      return this.historyEntry.watchProgress
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    effectiveListTypeIsList: function () {
      return (this.listType === 'list' || this.forceListType === 'list') && this.forceListType !== 'grid'
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

    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
    },

    showPlaylists: function () {
      return !this.$store.getters.getHidePlaylists
    },

    inHistory: function () {
      // When in the history page, showing relative dates isn't very useful.
      // We want to show the exact date instead
      return this.$route.name === 'history'
    },

    inUserPlaylist: function () {
      return this.playlistTypeFinal === 'user' || this.selectedUserPlaylist != null
    },

    selectedUserPlaylist: function () {
      if (this.playlistIdFinal == null) { return null }
      if (this.playlistIdFinal === '') { return null }

      return this.$store.getters.getPlaylist(this.playlistIdFinal)
    },

    playlistSharable() {
      // `playlistId` can be undefined
      // User playlist ID should not be shared
      return this.playlistIdFinal && this.playlistIdFinal.length !== 0 && !this.inUserPlaylist
    },

    invidiousUrl: function () {
      let videoUrl = `${this.currentInvidiousInstanceUrl}/watch?v=${this.id}`
      // `playlistId` can be undefined
      if (this.playlistSharable) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistIdFinal}`
      }
      return videoUrl
    },

    invidiousChannelUrl: function () {
      return `${this.currentInvidiousInstanceUrl}/channel/${this.channelId}`
    },

    youtubeUrl: function () {
      let videoUrl = `https://www.youtube.com/watch?v=${this.id}`
      if (this.playlistSharable) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistIdFinal}`
      }
      return videoUrl
    },

    youtubeShareUrl: function () {
      const videoUrl = `https://youtu.be/${this.id}`
      if (this.playlistSharable) {
        // `index` seems can be ignored
        return `${videoUrl}?list=${this.playlistIdFinal}`
      }
      return videoUrl
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
      const options = [
        {
          label: this.historyEntryExists
            ? this.$t('Video.Remove From History')
            : this.$t('Video.Mark As Watched'),
          value: 'history'
        }
      ]
      if (!this.hideSharingActions) {
        options.push(
          {
            type: 'divider'
          },
          {
            label: this.$t('Video.Copy YouTube Link'),
            value: 'copyYoutube'
          },
          {
            label: this.$t('Video.Copy YouTube Embedded Player Link'),
            value: 'copyYoutubeEmbed'
          },
          {
            label: this.$t('Video.Copy Invidious Link'),
            value: 'copyInvidious'
          },
          {
            type: 'divider'
          },
          {
            label: this.$t('Video.Open in YouTube'),
            value: 'openYoutube'
          },
          {
            label: this.$t('Video.Open YouTube Embedded Player'),
            value: 'openYoutubeEmbed'
          },
          {
            label: this.$t('Video.Open in Invidious'),
            value: 'openInvidious'
          }
        )
        if (this.channelId !== null) {
          options.push(
            {
              type: 'divider'
            },
            {
              label: this.$t('Video.Copy YouTube Channel Link'),
              value: 'copyYoutubeChannel'
            },
            {
              label: this.$t('Video.Copy Invidious Channel Link'),
              value: 'copyInvidiousChannel'
            },
            {
              type: 'divider'
            },
            {
              label: this.$t('Video.Open Channel in YouTube'),
              value: 'openYoutubeChannel'
            },
            {
              label: this.$t('Video.Open Channel in Invidious'),
              value: 'openInvidiousChannel'
            }
          )
        }
      }

      if (this.channelId !== null) {
        const hiddenChannels = JSON.parse(this.$store.getters.getChannelsHidden)
        const channelShouldBeHidden = hiddenChannels.some(c => c.name === this.channelId)

        options.push(
          {
            type: 'divider'
          },

          channelShouldBeHidden
            ? {
                label: this.$t('Video.Unhide Channel'),
                value: 'unhideChannel'
              }
            : {
                label: this.$t('Video.Hide Channel'),
                value: 'hideChannel'
              }
        )
      }

      return options
    },

    thumbnail: function () {
      if (this.thumbnailPreference === 'hidden') {
        return require('../../assets/img/thumbnail_placeholder.svg')
      }

      if (this.useDeArrowThumbnails && this.deArrowCache?.thumbnail != null) {
        return this.deArrowCache.thumbnail
      }

      let baseUrl
      if (this.backendPreference === 'invidious') {
        baseUrl = this.currentInvidiousInstanceUrl
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
        default:
          return `${baseUrl}/vi/${this.id}/mqdefault.jpg`
      }
    },

    hideVideoViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    addWatchedStyle: function () {
      return this.historyEntryExists && !this.inHistory
    },

    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
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

    displayDuration: function () {
      if (this.useDeArrowTitles && (this.duration === '' || this.duration === '0:00') && this.deArrowCache?.videoDuration) {
        return formatDurationAsTimestamp(this.deArrowCache.videoDuration)
      }
      return this.duration
    },

    playlistIdTypePairFinal() {
      if (this.playlistId) {
        return {
          playlistId: this.playlistId,
          playlistType: this.playlistType,
          playlistItemId: this.playlistItemId,
        }
      }

      // Get playlist ID from history ONLY if option enabled
      if (!this.showVideoWithLastViewedPlaylist) { return }
      if (!this.saveVideoHistoryWithLastViewedPlaylist) { return }

      return {
        playlistId: this.historyEntry?.lastViewedPlaylistId,
        playlistType: this.historyEntry?.lastViewedPlaylistType,
        playlistItemId: this.historyEntry?.lastViewedPlaylistItemId,
      }
    },

    playlistIdFinal: function () {
      return this.playlistIdTypePairFinal?.playlistId
    },
    playlistTypeFinal: function () {
      return this.playlistIdTypePairFinal?.playlistType
    },
    playlistItemIdFinal: function () {
      return this.playlistIdTypePairFinal?.playlistItemId
    },

    quickBookmarkPlaylist() {
      return this.$store.getters.getQuickBookmarkPlaylist
    },
    isQuickBookmarkEnabled() {
      return this.quickBookmarkPlaylist != null
    },
    isInQuickBookmarkPlaylist: function () {
      if (!this.isQuickBookmarkEnabled) { return false }

      // Accessing a reactive property has a negligible amount of overhead,
      // however as we know that some users have playlists that have more than 10k items in them
      // it adds up quickly, especially as there are usually lots of ft-list-video instances active at the same time.
      // So create a temporary variable outside of the array, so we only have to do it once.
      // Also the search is retriggered every time any playlist is modified.
      const id = this.id

      return this.quickBookmarkPlaylist.videos.some((video) => {
        return video.videoId === id
      })
    },
    quickBookmarkIconText: function () {
      if (!this.isQuickBookmarkEnabled) { return false }

      const translationProperties = {
        playlistName: this.quickBookmarkPlaylist.playlistName,
      }
      return this.isInQuickBookmarkPlaylist
        ? this.$t('User Playlists.Remove from Favorites', translationProperties)
        : this.$t('User Playlists.Add to Favorites', translationProperties)
    },
    quickBookmarkIconTheme: function () {
      return this.isInQuickBookmarkPlaylist ? 'base favorite' : 'base'
    },

    watchPageLinkTo() {
      // For `router-link` attribute `to`
      return {
        path: `/watch/${this.id}`,
        query: this.watchPageLinkQuery,
      }
    },
    watchPageLinkQuery() {
      const query = {}
      if (this.playlistIdFinal) { query.playlistId = this.playlistIdFinal }
      if (this.playlistTypeFinal) { query.playlistType = this.playlistTypeFinal }
      if (this.playlistItemIdFinal) { query.playlistItemId = this.playlistItemIdFinal }
      return query
    },

    useDeArrowTitles: function () {
      return this.$store.getters.getUseDeArrowTitles
    },

    useDeArrowThumbnails: function () {
      return this.$store.getters.getUseDeArrowThumbnails
    },

    deArrowCache: function () {
      return this.$store.getters.getDeArrowCache[this.id]
    },
  },
  watch: {
    showAddToPlaylistPrompt(value) {
      if (value) { return }
      // Execute on prompt close

      if (this.addToPlaylistPromptCloseCallback == null) { return }
      this.addToPlaylistPromptCloseCallback()
    },
  },
  created: function () {
    this.parseVideoData()

    if ((this.useDeArrowTitles || this.useDeArrowThumbnails) && !this.deArrowCache) {
      this.fetchDeArrowData()
    }

    if (this.useDeArrowThumbnails && this.deArrowCache && this.deArrowCache.thumbnail == null) {
      if (this.debounceGetDeArrowThumbnail == null) {
        this.debounceGetDeArrowThumbnail = debounce(this.fetchDeArrowThumbnail, 1000)
      }

      this.debounceGetDeArrowThumbnail()
    }
  },
  methods: {
    fetchDeArrowThumbnail: async function() {
      if (this.thumbnailPreference === 'hidden') { return }
      const videoId = this.id
      const thumbnail = await deArrowThumbnail(videoId, this.deArrowCache.thumbnailTimestamp)
      if (thumbnail) {
        const deArrowCacheClone = deepCopy(this.deArrowCache)
        deArrowCacheClone.thumbnail = thumbnail
        this.$store.commit('addThumbnailToDeArrowCache', deArrowCacheClone)
      }
    },
    fetchDeArrowData: async function() {
      const videoId = this.id
      const data = await deArrowData(this.id)
      const cacheData = { videoId, title: null, videoDuration: null, thumbnail: null, thumbnailTimestamp: null }
      if (Array.isArray(data?.titles) && data.titles.length > 0 && (data.titles[0].locked || data.titles[0].votes >= 0)) {
        // remove dearrow formatting markers https://github.com/ajayyy/DeArrow/blob/0da266485be902fe54259214c3cd7c942f2357c5/src/titles/titleFormatter.ts#L460
        cacheData.title = data.titles[0].title.replaceAll(/(^|\s)>(\S)/g, '$1$2').trim()
      }
      if (Array.isArray(data?.thumbnails) && data.thumbnails.length > 0 && (data.thumbnails[0].locked || data.thumbnails[0].votes >= 0)) {
        cacheData.thumbnailTimestamp = data.thumbnails.at(0).timestamp
      } else if (data?.videoDuration != null) {
        cacheData.thumbnailTimestamp = data.videoDuration * data.randomTime
      }
      cacheData.videoDuration = data?.videoDuration ? Math.floor(data.videoDuration) : null

      // Save data to cache whether data available or not to prevent duplicate requests
      this.$store.commit('addVideoToDeArrowCache', cacheData)

      // fetch dearrow thumbnails if enabled
      if (this.useDeArrowThumbnails && this.deArrowCache?.thumbnail === null) {
        if (this.debounceGetDeArrowThumbnail == null) {
          this.debounceGetDeArrowThumbnail = debounce(this.fetchDeArrowThumbnail, 1000)
        }

        this.debounceGetDeArrowThumbnail()
      }
    },

    handleExternalPlayer: function () {
      this.$emit('pause-player')

      const payload = {
        watchProgress: this.watchProgress,
        playbackRate: this.defaultPlayback,
        videoId: this.id,
        videoLength: this.data.lengthSeconds,
        playlistId: this.playlistIdFinal,
        playlistIndex: this.playlistIndex,
        playlistReverse: this.playlistReverse,
        playlistShuffle: this.playlistShuffle,
        playlistLoop: this.playlistLoop,
      }
      // Only play video in non playlist mode when user playlist detected
      if (this.inUserPlaylist) {
        Object.assign(payload, {
          playlistId: null,
          playlistIndex: null,
          playlistReverse: null,
          playlistShuffle: null,
          playlistLoop: null,
        })
      }
      this.openInExternalPlayer(payload)

      if (this.saveWatchedProgress && !this.historyEntryExists) {
        this.markAsWatched()
      }
    },

    handleOptionsClick: function (option) {
      switch (option) {
        case 'history':
          if (this.historyEntryExists) {
            this.removeFromWatched()
          } else {
            this.markAsWatched()
          }
          break
        case 'copyYoutube':
          copyToClipboard(this.youtubeShareUrl, { messageOnSuccess: this.$t('Share.YouTube URL copied to clipboard') })
          break
        case 'openYoutube':
          openExternalLink(this.youtubeUrl)
          break
        case 'copyYoutubeEmbed':
          copyToClipboard(this.youtubeEmbedUrl, { messageOnSuccess: this.$t('Share.YouTube Embed URL copied to clipboard') })
          break
        case 'openYoutubeEmbed':
          openExternalLink(this.youtubeEmbedUrl)
          break
        case 'copyInvidious':
          copyToClipboard(this.invidiousUrl, { messageOnSuccess: this.$t('Share.Invidious URL copied to clipboard') })
          break
        case 'openInvidious':
          openExternalLink(this.invidiousUrl)
          break
        case 'copyYoutubeChannel':
          copyToClipboard(this.youtubeChannelUrl, { messageOnSuccess: this.$t('Share.YouTube Channel URL copied to clipboard') })
          break
        case 'openYoutubeChannel':
          openExternalLink(this.youtubeChannelUrl)
          break
        case 'copyInvidiousChannel':
          copyToClipboard(this.invidiousChannelUrl, { messageOnSuccess: this.$t('Share.Invidious Channel URL copied to clipboard') })
          break
        case 'openInvidiousChannel':
          openExternalLink(this.invidiousChannelUrl)
          break
        case 'hideChannel':
          this.hideChannel(this.channelName, this.channelId)
          break
        case 'unhideChannel':
          this.unhideChannel(this.channelName, this.channelId)
          break
      }
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
      this.is4k = this.data.is4k
      this.hasCaptions = this.data.hasCaptions
      this.isPremium = this.data.premium || false
      this.viewCount = this.data.viewCount

      if (typeof this.data.premiereDate !== 'undefined') {
        let premiereDate = this.data.premiereDate

        // premiereDate will be a string when the subscriptions are restored from the cache
        if (typeof premiereDate === 'string') {
          premiereDate = new Date(premiereDate)
        }
        this.uploadedTime = premiereDate.toLocaleString([this.currentLocale, 'en'])
        this.published = premiereDate.getTime()
      } else if (typeof (this.data.premiereTimestamp) !== 'undefined') {
        this.uploadedTime = new Date(this.data.premiereTimestamp * 1000).toLocaleString([this.currentLocale, 'en'])
        this.published = this.data.premiereTimestamp * 1000
      } else if (typeof this.data.published === 'number' && !this.isLive) {
        this.published = this.data.published

        if (this.inHistory) {
          this.uploadedTime = new Date(this.data.published).toLocaleDateString([this.currentLocale, 'en'])
        } else {
          // Use 30 days per month, just like calculatePublishedDate
          this.uploadedTime = getRelativeTimeFromDate(this.data.published, false)
        }
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

    markAsWatched: function () {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        published: this.published,
        description: this.description,
        viewCount: this.viewCount,
        lengthSeconds: this.data.lengthSeconds,
        watchProgress: 0,
        timeWatched: new Date().getTime(),
        isLive: false,
        type: 'video'
      }
      this.updateHistory(videoData)
      showToast(this.$t('Video.Video has been marked as watched'))
    },

    removeFromWatched: function () {
      this.removeFromHistory(this.id)

      showToast(this.$t('Video.Video has been removed from your history'))
    },

    togglePlaylistPrompt: function () {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        description: this.description,
        viewCount: this.viewCount,
        lengthSeconds: this.data.lengthSeconds,
      }

      this.showAddToPlaylistPromptForManyVideos({ videos: [videoData] })

      // Focus when prompt closed
      this.addToPlaylistPromptCloseCallback = () => {
        // Run once only
        this.addToPlaylistPromptCloseCallback = null

        // `thumbnailLink` is a `router-link`
        // `focus()` can only be called on the actual element
        this.$refs.addToPlaylistIcon?.$el?.focus()
      }
    },

    hideChannel: function(channelName, channelId) {
      const hiddenChannels = JSON.parse(this.$store.getters.getChannelsHidden)
      hiddenChannels.push({ name: channelId, preferredName: channelName })
      this.updateChannelsHidden(JSON.stringify(hiddenChannels))

      showToast(this.$t('Channel Hidden', { channel: channelName }))
    },

    unhideChannel: function(channelName, channelId) {
      const hiddenChannels = JSON.parse(this.$store.getters.getChannelsHidden)
      this.updateChannelsHidden(JSON.stringify(hiddenChannels.filter(c => c.name !== channelId)))

      showToast(this.$t('Channel Unhidden', { channel: channelName }))
    },

    toggleQuickBookmarked() {
      if (!this.isQuickBookmarkEnabled) {
        // This should be prevented by UI
        return
      }

      if (this.isInQuickBookmarkPlaylist) {
        this.removeFromQuickBookmarkPlaylist()
      } else {
        this.addToQuickBookmarkPlaylist()
      }
    },
    addToQuickBookmarkPlaylist() {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        lengthSeconds: this.data.lengthSeconds,
      }

      this.addVideo({
        _id: this.quickBookmarkPlaylist._id,
        videoData,
      })
      // Update playlist's `lastUpdatedAt`
      this.updatePlaylist({ _id: this.quickBookmarkPlaylist._id })

      // TODO: Maybe show playlist name
      showToast(this.$t('Video.Video has been saved'))
    },
    removeFromQuickBookmarkPlaylist() {
      this.removeVideo({
        _id: this.quickBookmarkPlaylist._id,
        // Remove all playlist items with same videoId
        videoId: this.id,
      })
      // Update playlist's `lastUpdatedAt`
      this.updatePlaylist({ _id: this.quickBookmarkPlaylist._id })

      // TODO: Maybe show playlist name
      showToast(this.$t('Video.Video has been removed from your saved list'))
    },
    moveVideoUp: function() {
      this.$emit('move-video-up')
    },

    moveVideoDown: function() {
      this.$emit('move-video-down')
    },

    removeFromPlaylist: function() {
      this.$emit('remove-from-playlist')
    },

    ...mapActions([
      'openInExternalPlayer',
      'updateHistory',
      'removeFromHistory',
      'updateChannelsHidden',
      'showAddToPlaylistPromptForManyVideos',
      'addVideo',
      'updatePlaylist',
      'removeVideo',
    ])
  }
})
