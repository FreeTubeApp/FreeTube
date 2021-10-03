import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtListDropdown from '../ft-list-dropdown/ft-list-dropdown.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtShareButton from '../ft-share-button/ft-share-button.vue'

export default Vue.extend({
  name: 'WatchVideoInfo',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-list-dropdown': FtListDropdown,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-share-button': FtShareButton
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
    watchingPlaylist: {
      type: Boolean,
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
    theatrePossible: {
      type: Boolean,
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
  data: function () {
    return {
      formatTypeLabel: 'VIDEO FORMATS',
      formatTypeValues: [
        'dash',
        'legacy',
        'audio'
      ]
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    currentLocale: function () {
      return this.$store.getters.getCurrentLocale
    },

    profileList: function () {
      return this.$store.getters.getProfileList
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    },

    hideLiveChat: function () {
      return this.$store.getters.getHideLiveChat
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

    downloadLinkNames: function () {
      return this.downloadLinks.map((download) => {
        return download.label
      })
    },

    downloadLinkValues: function () {
      return this.downloadLinks.map((download) => {
        return download.url
      })
    },

    formatTypeNames: function () {
      return [
        this.$t('Change Format.Use Dash Formats').toUpperCase(),
        this.$t('Change Format.Use Legacy Formats').toUpperCase(),
        this.$t('Change Format.Use Audio Formats').toUpperCase()
      ]
    },

    totalLikeCount: function () {
      return this.likeCount + this.dislikeCount
    },

    likePercentageRatio: function () {
      return parseInt(this.likeCount / this.totalLikeCount * 100)
    },

    parsedViewCount: function () {
      if (this.hideVideoViews) {
        return null
      }
      return this.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ` ${this.$t('Video.Views').toLowerCase()}`
    },

    isSubscribed: function () {
      const subIndex = this.profileList[this.activeProfile].subscriptions.findIndex((channel) => {
        return channel.id === this.channelId
      })

      if (subIndex === -1) {
        return false
      } else {
        return true
      }
    },

    subscribedText: function () {
      if (this.isSubscribed) {
        return `${this.$t('Channel.Unsubscribe').toUpperCase()} ${this.subscriptionCountText}`
      } else {
        return `${this.$t('Channel.Subscribe').toUpperCase()} ${this.subscriptionCountText}`
      }
    },

    dateString() {
      const date = new Date(this.published)
      const locale = this.currentLocale.replace('_', '-')
      const localeDateString = new Intl.DateTimeFormat([locale, 'en'], { dateStyle: 'medium' }).format(date)
      return `${localeDateString}`
    },

    publishedString() {
      if (this.isLiveContent && this.isLive) {
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
      /* eslint-disable-next-line */
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
    }
  },
  methods: {
    handleExternalPlayer: function () {
      this.$emit('pause-player')

      this.openInExternalPlayer({
        strings: this.$t('Video.External Player'),
        watchProgress: this.getTimestamp(),
        playbackRate: this.defaultPlayback,
        videoId: this.id,
        playlistId: this.playlistId,
        playlistIndex: this.getPlaylistIndex(),
        playlistReverse: this.getPlaylistReverse(),
        playlistShuffle: this.getPlaylistShuffle(),
        playlistLoop: this.getPlaylistLoop()
      })
    },

    goToChannel: function () {
      this.$router.push({ path: `/channel/${this.channelId}` })
    },

    toggleSave: function () {
      if (this.inFavoritesPlaylist) {
        this.removeFromPlaylist()
      } else {
        this.addToPlaylist()
      }
    },

    handleSubscription: function () {
      if (this.channelId === '') {
        return
      }

      const currentProfile = JSON.parse(JSON.stringify(this.profileList[this.activeProfile]))
      const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))

      if (this.isSubscribed) {
        currentProfile.subscriptions = currentProfile.subscriptions.filter((channel) => {
          return channel.id !== this.channelId
        })

        this.updateProfile(currentProfile)
        this.showToast({
          message: this.$t('Channel.Channel has been removed from your subscriptions')
        })

        if (this.activeProfile === 0) {
          // Check if a subscription exists in a different profile.
          // Remove from there as well.
          let duplicateSubscriptions = 0

          this.profileList.forEach((profile) => {
            if (profile._id === 'allChannels') {
              return
            }
            const parsedProfile = JSON.parse(JSON.stringify(profile))
            const index = parsedProfile.subscriptions.findIndex((channel) => {
              return channel.id === this.channelId
            })

            if (index !== -1) {
              duplicateSubscriptions++

              parsedProfile.subscriptions = parsedProfile.subscriptions.filter((x) => {
                return x.id !== this.channelId
              })

              this.updateProfile(parsedProfile)
            }
          })

          if (duplicateSubscriptions > 0) {
            const message = this.$t('Channel.Removed subscription from $ other channel(s)')
            this.showToast({
              message: message.replace('$', duplicateSubscriptions)
            })
          }
        }
      } else {
        const subscription = {
          id: this.channelId,
          name: this.channelName,
          thumbnail: this.channelThumbnail
        }
        currentProfile.subscriptions.push(subscription)

        this.updateProfile(currentProfile)
        this.showToast({
          message: this.$t('Channel.Added channel to your subscriptions')
        })

        if (this.activeProfile !== 0) {
          const index = primaryProfile.subscriptions.findIndex((channel) => {
            return channel.id === this.channelId
          })

          if (index === -1) {
            primaryProfile.subscriptions.push(subscription)
            this.updateProfile(primaryProfile)
          }
        }
      }
    },

    handleFormatChange: function (format) {
      switch (format) {
        case 'dash':
          this.$parent.enableDashFormat()
          break
        case 'legacy':
          this.$parent.enableLegacyFormat()
          break
        case 'audio':
          this.$parent.enableAudioFormat()
          break
      }
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
      'openInExternalPlayer',
      'updateProfile',
      'addVideo',
      'removeVideo',
      'openExternalLink'
    ])
  }
})
