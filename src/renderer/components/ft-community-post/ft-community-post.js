import Vue from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import { mapActions } from 'vuex'
import autolinker from 'autolinker'
import VueTinySlider from 'vue-tiny-slider'

export default Vue.extend({
  name: 'FtCommunityPost',
  components: {
    'ft-list-video': FtListVideo,
    'tiny-slider': VueTinySlider
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
      postText: '',
      postId: '',
      authorThumbnails: null,
      publishedText: '',
      voteCount: '',
      postContent: '',
      commentCount: '',
      isLoading: true,
      author: ''
    }
  },
  computed: {
    tinySliderOptions: function() {
      return {
        items: 1,
        arrowKeys: true,
        controls: false,
        autoplay: false,
        slideBy: 'page',
        navPosition: 'bottom'
      }
    },
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

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

    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    inHistory: function () {
      // When in the history page, showing relative dates isn't very useful.
      // We want to show the exact date instead
      return this.$router.currentRoute.name === 'history'
    },

    invidiousUrl: function () {
      return `${this.invidiousInstance}/watch?v=${this.id}`
    },

    invidiousChannelUrl: function () {
      return `${this.invidiousInstance}/channel/${this.channelId}`
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

    optionsNames: function () {
      const names = [
        this.$t('Video.Open in YouTube'),
        this.$t('Video.Copy YouTube Link'),
        this.$t('Video.Open YouTube Embedded Player'),
        this.$t('Video.Copy YouTube Embedded Player Link'),
        this.$t('Video.Open in Invidious'),
        this.$t('Video.Copy Invidious Link'),
        this.$t('Video.Open Channel in YouTube'),
        this.$t('Video.Copy YouTube Channel Link'),
        this.$t('Video.Open Channel in Invidious'),
        this.$t('Video.Copy Invidious Channel Link')
      ]

      if (this.watched) {
        names.unshift(this.$t('Video.Remove From History'))
      } else {
        names.unshift(this.$t('Video.Mark As Watched'))
      }

      return names
    },

    thumbnail: function () {
      return this.image
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

    favoriteIconTheme: function () {
      return this.inFavoritesPlaylist ? 'base favorite' : 'base'
    }
  },
  mounted: function () {
    this.parseVideoData()
  },
  methods: {
    toggleSave: function () {
      if (this.inFavoritesPlaylist) {
        this.removeFromPlaylist()
      } else {
        this.addToPlaylist()
      }
    },

    handleOptionsClick: function (option) {
      console.log('Handling share')
      console.log(option)

      switch (option) {
        case 'history':
          if (this.watched) {
            this.removeFromWatched()
          } else {
            this.markAsWatched()
          }
          break
        case 'copyYoutube':
          navigator.clipboard.writeText(this.youtubeShareUrl)
          this.showToast({
            message: this.$t('Share.YouTube URL copied to clipboard')
          })
          break
        case 'openYoutube':
          if (this.usingElectron) {
            const shell = require('electron').shell
            shell.openExternal(this.youtubeUrl)
          }
          break
        case 'copyYoutubeEmbed':
          navigator.clipboard.writeText(this.youtubeEmbedUrl)
          this.showToast({
            message: this.$t('Share.YouTube Embed URL copied to clipboard')
          })
          break
        case 'openYoutubeEmbed':
          if (this.usingElectron) {
            const shell = require('electron').shell
            shell.openExternal(this.youtubeEmbedUrl)
          }
          break
        case 'copyInvidious':
          navigator.clipboard.writeText(this.invidiousUrl)
          this.showToast({
            message: this.$t('Share.Invidious URL copied to clipboard')
          })
          break
        case 'openInvidious':
          if (this.usingElectron) {
            console.log('using electron')
            const shell = require('electron').shell
            shell.openExternal(this.invidiousUrl)
          }
          break
        case 'copyYoutubeChannel':
          navigator.clipboard.writeText(this.youtubeChannelUrl)
          this.showToast({
            message: this.$t('Share.YouTube Channel URL copied to clipboard')
          })
          break
        case 'openYoutubeChannel':
          if (this.usingElectron) {
            const shell = require('electron').shell
            shell.openExternal(this.youtubeChannelUrl)
          }
          break
        case 'copyInvidiousChannel':
          navigator.clipboard.writeText(this.invidiousChannelUrl)
          this.showToast({
            message: this.$t('Share.Invidious Channel URL copied to clipboard')
          })
          break
        case 'openInvidiousChannel':
          if (this.usingElectron) {
            const shell = require('electron').shell
            shell.openExternal(this.invidiousChannelUrl)
          }
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
      if ('backstagePostThreadRenderer' in this.data) {
        this.postText = 'Shared post'
        this.type = 'text'
        this.authorThumbnails = ['', 'https://yt3.ggpht.com/ytc/AAUvwnjm-0qglHJkAHqLFsCQQO97G7cCNDuDLldsrn25Lg=s88-c-k-c0x00ffffff-no-rj']
        return
      }
      this.postText = autolinker.link(this.data.postText)
      this.authorThumbnails = this.data.authorThumbnails
      this.postContent = this.data.postContent
      this.postId = this.data.postId
      this.toLocalePublicationString({
        publishText: this.data.publishedText,
        templateString: this.$t('Video.Publicationtemplate'),
        timeStrings: this.$t('Video.Published'),
        liveStreamString: this.$t('Video.Watching'),
        upcomingString: this.$t('Video.Published.Upcoming'),
        isLive: this.isLive,
        isUpcoming: this.isUpcoming,
        isRSS: this.data.isRSS
      }).then((data) => {
        this.publishedText = data
      }).catch((error) => {
        console.error(error)
      })
      this.voteCount = this.data.voteCount
      this.commentCount = this.data.commentCount
      this.type = (this.data.postContent !== null && this.data.postContent !== undefined) ? this.data.postContent.type : 'text'
      this.author = this.data.author
      this.isLoading = false
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
        published: this.publishedText.split(',')[0],
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
      'updateHistory',
      'removeFromHistory',
      'addVideo',
      'removeVideo'
    ])
  }
})
