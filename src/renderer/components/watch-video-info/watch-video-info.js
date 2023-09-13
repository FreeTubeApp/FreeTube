import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
import FtSubscribeButton from '../ft-subscribe-button/ft-subscribe-button.vue'
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
    viewCount: {
      type: Number,
      required: true
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
      return this.$i18n.locale.replace('_', '-')
    },

    hideVideoLikesAndDislikes: function () {
      return this.$store.getters.getHideVideoLikesAndDislikes
    },

    hideVideoViews: function () {
      return this.$store.getters.getHideVideoViews
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

    downloadLinkOptions: function () {
      return this.downloadLinks.map((download) => {
        return {
          label: download.label,
          value: download.url
        }
      })
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
      if (this.hideVideoViews) {
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

    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
    }
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
          setTimeout(() => {
            this.$emit('scroll-to-info-area')
          })
        }
      })
    }
  },
  methods: {
    handleExternalPlayer: function () {
      this.$emit('pause-player')

      this.openInExternalPlayer({
        watchProgress: this.getTimestamp(),
        playbackRate: this.defaultPlayback,
        videoId: this.id,
        videoLength: this.lengthSeconds,
        playlistId: this.playlistId,
        playlistIndex: this.getPlaylistIndex(),
        playlistReverse: this.getPlaylistReverse(),
        playlistShuffle: this.getPlaylistShuffle(),
        playlistLoop: this.getPlaylistLoop()
      })
    },

    toggleSave: function () {
      if (this.inFavoritesPlaylist) {
        this.removeFromPlaylist()
      } else {
        this.addToPlaylist()
      }
    },

    handleDownload: function (index) {
      const selectedDownloadLinkOption = this.downloadLinkOptions[index]
      const url = selectedDownloadLinkOption.value
      const linkName = selectedDownloadLinkOption.label
      const extension = this.grabExtensionFromUrl(linkName)

      if (this.downloadBehavior === 'open') {
        openExternalLink(url)
      } else {
        this.downloadMedia({
          url: url,
          title: this.title,
          extension: extension
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

    addToPlaylist: function () {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        published: '',
        description: this.description,
        viewCount: this.viewCount,
        lengthSeconds: this.lengthSeconds,
        timeAdded: new Date().getTime(),
        isLive: false,
        type: 'video',
      }

      const payload = {
        playlistName: 'Favorites',
        videoData: videoData
      }

      this.addVideo(payload)

      showToast(this.$t('Video.Video has been saved'))
    },

    removeFromPlaylist: function () {
      const payload = {
        playlistName: 'Favorites',
        videoId: this.id
      }

      this.removeVideo(payload)

      showToast(this.$t('Video.Video has been removed from your saved list'))
    },

    ...mapActions([
      'openInExternalPlayer',
      'addVideo',
      'removeVideo',
      'downloadMedia'
    ])
  }
})
