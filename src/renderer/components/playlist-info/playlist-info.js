import { defineComponent } from 'vue'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
import { copyToClipboard, formatNumber, openExternalLink } from '../../helpers/utils'

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
      title: '',
      channelThumbnail: '',
      channelName: '',
      channelId: '',
      videoCount: 0,
      viewCount: null,
      lastUpdated: '',
      description: '',
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

    hideViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    thumbnail: function () {
      switch (this.thumbnailPreference) {
        case 'start':
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mq1.jpg`
        case 'middle':
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mq2.jpg`
        case 'end':
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mq3.jpg`
        default:
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mqdefault.jpg`
      }
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
