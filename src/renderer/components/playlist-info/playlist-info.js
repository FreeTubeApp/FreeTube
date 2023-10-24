import { defineComponent } from 'vue'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
import { copyToClipboard, formatNumber, openExternalLink } from '../../helpers/utils'
import { isNullOrEmpty } from '../../helpers/strings'
import { getPipedUrlInfo } from '../../helpers/api/piped'

export default defineComponent({
  name: 'PlaylistInfo',
  components: {
    'ft-share-button': FtShareButton
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data: function () {
    return {
      id: '',
      firstVideoId: '',
      playlistThumbnail: '',
      title: '',
      channelThumbnail: '',
      channelName: '',
      channelId: null,
      videoCount: 0,
      viewCount: null,
      lastUpdated: '',
      description: '',
      firstVideoThumbnail: null,
      infoSource: ''
    }
  },
  computed: {
    hideSharingActions: function() {
      return this.$store.getters.getHideSharingActions
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
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

    fallbackPreference: function () {
      return this.$store.getters.getFallbackPreference
    },

    hideViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    thumbnail: function () {
      if (this.thumbnailPreference === 'hidden') {
        return require('../../assets/img/thumbnail_placeholder.svg')
      }

      if (this.backendPreference === 'local') {
        return this.data.playlistThumbnail
      }

      let baseUrl = ''
      let baseData = ''
      let backendPreference = this.backendPreference
      if (this.data.infoSource === 'piped' && backendPreference === 'piped') {
        if (this.data.firstVideoThumbnail) {
          baseData = getPipedUrlInfo(this.data.firstVideoThumbnail)
          baseUrl = baseData.baseUrl
        } else {
          backendPreference = this.fallbackPreference
        }
      }

      if (isNullOrEmpty(baseData)) {
        if (backendPreference === 'invidious') {
          baseUrl = this.currentInvidiousInstance
        } else {
          baseUrl = 'https://i.ytimg.com'
        }
      }

      let imageUrl = ''

      switch (this.thumbnailPreference) {
        case 'start':
          imageUrl = `${baseUrl}/vi/${this.firstVideoId}/mq1.jpg`
          break
        case 'middle':
          imageUrl = `${baseUrl}/vi/${this.firstVideoId}/mq2.jpg`
          break
        case 'end':
          imageUrl = `${baseUrl}/vi/${this.firstVideoId}/mq3.jpg`
          break
        default:
          imageUrl = `${baseUrl}/vi/${this.firstVideoId}/mqdefault.jpg`
      }
      if (!isNullOrEmpty(baseData)) {
        imageUrl += `?host=${baseData.host}`
      }
      return imageUrl
    }
  },
  mounted: function () {
    this.id = this.data.id
    this.firstVideoId = this.data.firstVideoId
    this.title = this.data.title
    this.channelName = this.data.channelName
    this.channelThumbnail = this.data.channelThumbnail
    this.channelId = this.data.channelId
    this.uploadedTime = this.data.uploaded_at
    this.description = this.data.description
    this.infoSource = this.data.infoSource

    // Causes errors if not put inside of a check
    if (this.data.viewCount != null) {
      // youtube displays 'No views' instead of 0 views for NaN viewCounts
      const views = isNaN(this.data.viewCount) ? 0 : this.data.viewCount
      this.viewCount = this.hideViews ? null : formatNumber(views)
    }

    if (typeof (this.data.videoCount) !== 'undefined' && !isNaN(this.data.videoCount)) {
      this.videoCount = formatNumber(this.data.videoCount)
    }

    this.lastUpdated = this.data.lastUpdated
  },
  methods: {
    sharePlaylist: function (method) {
      const youtubeUrl = `https://youtube.com/playlist?list=${this.id}`
      const invidiousUrl = `${this.currentInvidiousInstance}/playlist?list=${this.id}`

      switch (method) {
        case 'copyYoutube':
          copyToClipboard(youtubeUrl, { messageOnSuccess: this.$t('Share.YouTube URL copied to clipboard') })
          break
        case 'openYoutube':
          openExternalLink(youtubeUrl)
          break
        case 'copyInvidious':
          copyToClipboard(invidiousUrl, { messageOnSuccess: this.$t('Share.Invidious URL copied to clipboard') })
          break
        case 'openInvidious':
          openExternalLink(invidiousUrl)
          break
      }
    }
  }
})
