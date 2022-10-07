import Vue from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'
import i18n from '../../i18n/index'

export default Vue.extend({
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
    }
  },
  data: function () {
    return {
      id: '',
      title: '',
      channelName: '',
      channelId: '',
      viewCount: 0,
      parsedViewCount: '',
      uploadedTime: '',
      duration: '',
      description: '',
      watched: false,
      watchProgress: 0,
      publishedText: '',
      isLive: false,
      isFavorited: false,
      isUpcoming: false,
      isPremium: false,
      hideViews: false
    }
  },
  computed: {
    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
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
      return this.$router.currentRoute.name === 'history'
    },

    invidiousUrl: function () {
      return `${this.currentInvidiousInstance}/watch?v=${this.id}`
    },

    invidiousChannelUrl: function () {
      return `${this.currentInvidiousInstance}/channel/${this.channelId}`
    },

    youtubeUrl: function () {
      return `https://www.youtube.com/watch?v=${this.id}`
    },

    youtubeShareUrl: function () {
      return `https://youtu.be/${this.id}`
    },

    youtubeChannelUrl: function () {
      return `https://youtube.com/channel/${this.channelId}`
    },

    youtubeEmbedUrl: function () {
      return `https://www.youtube-nocookie.com/embed/${this.id}`
    },

    progressPercentage: function () {
      return (this.watchProgress / this.data.lengthSeconds) * 100
    },

    hideSharingActions: function() {
      return this.$store.getters.getHideSharingActions
    },

    dropdownOptions: function () {
      const options = []
      options.push(
        {
          label: this.watched
            ? this.$t('Video.Remove From History')
            : this.$t('Video.Mark As Watched'),
          value: 'history'
        }
      )
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
          },
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

      return options
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
        default:
          return `${baseUrl}/vi/${this.id}/mqdefault.jpg`
      }
    },

    hideLiveStreams: function() {
      return this.$store.getters.getHideLiveStreams
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

    currentLocale: function () {
      return i18n.locale.replace('_', '-')
    }
  },
  mounted: function () {
    this.parseVideoData()
    this.checkIfWatched()
  },
  methods: {
    handleExternalPlayer: function () {
      this.$emit('pause-player')

      this.openInExternalPlayer({
        watchProgress: this.watchProgress,
        playbackRate: this.defaultPlayback,
        videoId: this.id,
        videoLength: this.data.lengthSeconds,
        playlistId: this.playlistId,
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

    handleOptionsClick: function (option) {
      switch (option) {
        case 'history':
          if (this.watched) {
            this.removeFromWatched()
          } else {
            this.markAsWatched()
          }
          break
        case 'copyYoutube':
          this.copyToClipboard({ content: this.youtubeShareUrl, messageOnSuccess: this.$t('Share.YouTube URL copied to clipboard') })
          break
        case 'openYoutube':
          this.openExternalLink(this.youtubeUrl)
          break
        case 'copyYoutubeEmbed':
          this.copyToClipboard({ content: this.youtubeEmbedUrl, messageOnSuccess: this.$t('Share.YouTube Embed URL copied to clipboard') })
          break
        case 'openYoutubeEmbed':
          this.openExternalLink(this.youtubeEmbedUrl)
          break
        case 'copyInvidious':
          this.copyToClipboard({ content: this.invidiousUrl, messageOnSuccess: this.$t('Share.Invidious URL copied to clipboard') })
          break
        case 'openInvidious':
          this.openExternalLink(this.invidiousUrl)
          break
        case 'copyYoutubeChannel':
          this.copyToClipboard({ content: this.youtubeChannelUrl, messageOnSuccess: this.$t('Share.YouTube Channel URL copied to clipboard') })
          break
        case 'openYoutubeChannel':
          this.openExternalLink(this.youtubeChannelUrl)
          break
        case 'copyInvidiousChannel':
          this.copyToClipboard({ content: this.invidiousChannelUrl, messageOnSuccess: this.$t('Share.Invidious Channel URL copied to clipboard') })
          break
        case 'openInvidiousChannel':
          this.openExternalLink(this.invidiousChannelUrl)
          break
      }
    },

    // For Invidious data, as duration is sent in seconds
    calculateVideoDuration: function (lengthSeconds) {
      if (typeof lengthSeconds === 'string') {
        return lengthSeconds
      }

      if (typeof lengthSeconds === 'undefined') {
        return '0:00'
      }
      let durationText = ''
      let time = lengthSeconds
      let hours = 0

      if (time >= 3600) {
        hours = Math.floor(time / 3600)
        time = time - hours * 3600
      }

      let minutes = Math.floor(time / 60)
      let seconds = time - minutes * 60

      if (seconds < 10) {
        seconds = '0' + seconds
      }

      if (minutes < 10 && hours > 0) {
        minutes = '0' + minutes
      }

      if (hours > 0) {
        durationText = hours + ':' + minutes + ':' + seconds
      } else {
        durationText = minutes + ':' + seconds
      }

      return durationText
    },

    parseVideoData: function () {
      this.id = this.data.videoId
      this.title = this.data.title
      // this.thumbnail = this.data.videoThumbnails[4].url

      this.channelName = this.data.author
      this.channelId = this.data.authorId
      this.duration = this.calculateVideoDuration(this.data.lengthSeconds)
      this.description = this.data.description
      this.isLive = this.data.liveNow || this.data.lengthSeconds === 'undefined'
      this.isUpcoming = this.data.isUpcoming || this.data.premiere
      this.isPremium = this.data.premium || false
      this.viewCount = this.data.viewCount

      if (typeof (this.data.premiereTimestamp) !== 'undefined') {
        this.publishedText = new Date(this.data.premiereTimestamp * 1000).toLocaleString()
      } else {
        this.publishedText = this.data.publishedText
      }

      if (typeof (this.data.publishedText) !== 'undefined' && this.data.publishedText !== null && !this.isLive) {
        // produces a string according to the template in the locales string
        this.toLocalePublicationString({
          publishText: this.publishedText,
          isLive: this.isLive,
          isUpcoming: this.isUpcoming,
          isRSS: this.data.isRSS
        }).then((data) => {
          this.uploadedTime = data
        }).catch((error) => {
          console.error(error)
        })
      }

      if (this.hideVideoViews) {
        this.hideViews = true
      } else if (typeof (this.data.viewCount) !== 'undefined' && this.data.viewCount !== null) {
        this.parsedViewCount = Intl.NumberFormat(this.currentLocale).format(this.data.viewCount)
      } else if (typeof (this.data.viewCountText) !== 'undefined') {
        this.parsedViewCount = this.data.viewCountText.replace(' views', '')
      } else {
        this.hideViews = true
      }
    },

    checkIfWatched: function () {
      const historyIndex = this.historyCache.findIndex((video) => {
        return video.videoId === this.id
      })

      if (historyIndex !== -1) {
        this.watched = true
        this.watchProgress = this.historyCache[historyIndex].watchProgress

        if (this.historyCache[historyIndex].published !== '') {
          const videoPublished = this.historyCache[historyIndex].published
          const videoPublishedDate = new Date(videoPublished)
          this.publishedText = videoPublishedDate.toLocaleDateString()
        } else {
          this.publishedText = ''
        }
      }
    },

    markAsWatched: function () {
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
        paid: false,
        type: 'video'
      }
      this.updateHistory(videoData)
      this.showToast({
        message: this.$t('Video.Video has been marked as watched')
      })

      this.watched = true
    },

    removeFromWatched: function () {
      this.removeFromHistory(this.id)

      this.showToast({
        message: this.$t('Video.Video has been removed from your history')
      })

      this.watched = false
      this.watchProgress = 0
    },

    addToPlaylist: function () {
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
        paid: false,
        type: 'video'
      }

      const payload = {
        playlistName: 'Favorites',
        videoData: videoData
      }

      this.addVideo(payload)

      this.showToast({
        message: this.$t('Video.Video has been saved')
      })
    },

    removeFromPlaylist: function () {
      const payload = {
        playlistName: 'Favorites',
        videoId: this.id
      }

      this.removeVideo(payload)

      this.showToast({
        message: this.$t('Video.Video has been removed from your saved list')
      })
    },

    ...mapActions([
      'showToast',
      'toLocalePublicationString',
      'openInExternalPlayer',
      'updateHistory',
      'removeFromHistory',
      'addVideo',
      'removeVideo',
      'openExternalLink',
      'copyToClipboard'
    ])
  }
})
