import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtShareButton from '../FtShareButton/FtShareButton.vue'
import FtSubscribeButton from '../FtSubscribeButton/FtSubscribeButton.vue'
import { formatNumber, openExternalLink, showToast } from '../../helpers/utils'

export default defineComponent({
  name: 'WatchVideoInfo',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton,
    'ft-share-button': FtShareButton,
    'ft-subscribe-button': FtSubscribeButton
  },
  props: {
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      required: true
    },
    published: {
      type: Number,
      required: true
    },
    premiereDate: {
      type: Date,
      default: undefined
    },
    viewCount: {
      type: Number,
      default: null
    },
    subscriptionCountText: {
      type: String,
      required: true
    },
    likeCount: {
      type: Number,
      default: 0
    },
    dislikeCount: {
      type: Number,
      default: 0
    },
    getTimestamp: {
      type: Function,
      required: true
    },
    isLive: {
      type: Boolean,
      required: false
    },
    isLiveContent: {
      type: Boolean,
      required: true
    },
    isUpcoming: {
      type: Boolean,
      required: true
    },
    downloadLinks: {
      type: Array,
      required: true
    },
    playlistId: {
      type: String,
      default: null
    },
    getPlaylistIndex: {
      type: Function,
      required: true
    },
    getPlaylistReverse: {
      type: Function,
      required: true
    },
    getPlaylistShuffle: {
      type: Function,
      required: true
    },
    getPlaylistLoop: {
      type: Function,
      required: true
    },
    lengthSeconds: {
      type: Number,
      required: true
    },
    videoThumbnail: {
      type: String,
      required: true
    },
    inUserPlaylist: {
      type: Boolean,
      required: true
    },
    isUnlisted: {
      type: Boolean,
      required: false
    },
    canSaveWatchedProgress: {
      type: Boolean,
      required: true
    },
  },
  emits: [
    'change-format',
    'pause-player',
    'set-info-area-sticky',
    'scroll-to-info-area',
    'save-watched-progress',
  ],
  data: function () {
    return {
      usingElectron: process.env.IS_ELECTRON
    }
  },
  computed: {
    hideSharingActions: function() {
      return this.$store.getters.getHideSharingActions
    },

    hideUnsubscribeButton: function() {
      return this.$store.getters.getHideUnsubscribeButton
    },

    currentLocale: function () {
      return this.$i18n.locale
    },

    hideVideoLikesAndDislikes: function () {
      return this.$store.getters.getHideVideoLikesAndDislikes
    },

    hideVideoViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    hideUploader: function () {
      return this.$store.getters.getHideUploader
    },

    showPlaylists: function () {
      return !this.$store.getters.getHidePlaylists
    },

    watchedProgressSavingInSemiAutoMode() {
      return this.$store.getters.getWatchedProgressSavingMode === 'semi-auto'
    },

    rememberHistory() {
      return this.$store.getters.getRememberHistory
    },

    downloadBehavior: function () {
      return this.$store.getters.getDownloadBehavior
    },

    formatTypeOptions: function () {
      return [
        {
          label: this.$t('Change Format.Use Dash Formats').toUpperCase(),
          value: 'dash'
        },
        {
          label: this.$t('Change Format.Use Legacy Formats').toUpperCase(),
          value: 'legacy'
        },
        {
          label: this.$t('Change Format.Use Audio Formats').toUpperCase(),
          value: 'audio'
        }
      ]
    },

    totalLikeCount: function () {
      return this.likeCount + this.dislikeCount
    },

    parsedLikeCount: function () {
      if (this.hideVideoLikesAndDislikes || this.likeCount === null) {
        return null
      }

      return formatNumber(this.likeCount)
    },

    parsedDislikeCount: function () {
      if (this.hideVideoLikesAndDislikes || this.dislikeCount === null) {
        return null
      }

      return formatNumber(this.dislikeCount)
    },

    likePercentageRatio: function () {
      return parseInt(this.likeCount / this.totalLikeCount * 100)
    },

    parsedViewCount: function () {
      if (this.hideVideoViews || this.viewCount == null) {
        return null
      }

      return this.$tc('Global.Counts.View Count', this.viewCount, { count: formatNumber(this.viewCount) })
    },

    dateString: function () {
      const date = new Date(this.published)
      const localeDateString = new Intl.DateTimeFormat([this.currentLocale, 'en'], { dateStyle: 'medium' }).format(date)
      // replace spaces with no break spaces to make the date act as a single entity while wrapping
      return `${localeDateString}`.replaceAll(' ', '\u00A0')
    },

    publishedString: function () {
      if (this.isLive) {
        return this.$t('Video.Started streaming on')
      } else if (this.isLiveContent && !this.isLive) {
        return this.$t('Video.Streamed on')
      } else {
        return this.$t('Video.Published on')
      }
    },

    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },

    historyEntry: function () {
      return this.$store.getters.getHistoryCacheById[this.id]
    },

    historyEntryExists: function () {
      return typeof this.historyEntry !== 'undefined'
    },

    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
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
      // it adds up quickly. So create a temporary variable outside of the array, so we only have to do it once.
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
  },
  mounted: function () {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.title,
        artist: this.channelName,
        artwork: [
          {
            src: this.videoThumbnail,
            sizes: '128x128',
            type: 'image/png'
          }
        ]
      })

      this.$watch('$refs.downloadButton.dropdownShown', (dropdownShown) => {
        this.$emit('set-info-area-sticky', !dropdownShown)

        if (dropdownShown && window.innerWidth >= 901) {
          // adds a slight delay so we know that the dropdown has shown up
          // and won't mess up our scrolling
          nextTick(() => {
            this.$emit('scroll-to-info-area')
          })
        }
      })
    }
  },
  methods: {
    handleExternalPlayer: function () {
      this.$emit('pause-player')

      const payload = {
        watchProgress: this.getTimestamp(),
        playbackRate: this.defaultPlayback,
        videoId: this.id,
        videoLength: this.lengthSeconds,
        playlistId: this.playlistId,
        playlistIndex: this.getPlaylistIndex(),
        playlistReverse: this.getPlaylistReverse(),
        playlistShuffle: this.getPlaylistShuffle(),
        playlistLoop: this.getPlaylistLoop(),
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

      if (this.rememberHistory) {
        // Marking as watched
        const videoData = {
          videoId: this.id,
          title: this.title,
          author: this.channelName,
          authorId: this.channelId,
          published: this.published,
          description: this.description,
          viewCount: this.viewCount,
          lengthSeconds: this.lengthSeconds,
          watchProgress: 0,
          timeWatched: Date.now(),
          isLive: false,
          type: 'video'
        }

        this.updateHistory(videoData)

        if (!this.historyEntryExists) {
          showToast(this.$t('Video.Video has been marked as watched'))
        }
      }
    },

    handleDownload: function (index) {
      const selectedDownloadLinkOption = this.downloadLinks[index]
      const mimeTypeUrl = selectedDownloadLinkOption.value.split('||')

      if (!process.env.IS_ELECTRON || this.downloadBehavior === 'open') {
        openExternalLink(mimeTypeUrl[1])
      } else {
        this.downloadMedia({
          url: mimeTypeUrl[1],
          title: this.title,
          mimeType: mimeTypeUrl[0]
        })
      }
    },

    grabExtensionFromUrl: function (url) {
      const regex = /\/(\w*)/i
      const group = url.match(regex)
      if (group.length === 0) {
        return ''
      }
      return group[1]
    },

    togglePlaylistPrompt: function () {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        description: this.description,
        viewCount: this.viewCount,
        lengthSeconds: this.lengthSeconds,
        published: this.published,
        premiereDate: this.premiereDate,
      }

      this.showAddToPlaylistPromptForManyVideos({ videos: [videoData] })
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
        lengthSeconds: this.lengthSeconds,
        published: this.published,
        premiereDate: this.premiereDate,
      }

      this.addVideo({
        _id: this.quickBookmarkPlaylist._id,
        videoData,
      })

      // TODO: Maybe show playlist name
      showToast(this.$t('Video.Video has been saved'))
    },
    removeFromQuickBookmarkPlaylist() {
      this.removeVideo({
        _id: this.quickBookmarkPlaylist._id,
        // Remove all playlist items with same videoId
        videoId: this.id,
      })

      // TODO: Maybe show playlist name
      showToast(this.$t('Video.Video has been removed from your saved list'))
    },

    changeFormat: function(value) {
      this.$emit('change-format', value)
    },

    saveWatchedProgressManually() {
      this.$emit('save-watched-progress')
    },

    ...mapActions([
      'openInExternalPlayer',
      'downloadMedia',
      'showAddToPlaylistPromptForManyVideos',
      'addVideo',
      'updateHistory',
      'removeVideo',
    ])
  }
})
