import Vue from 'vue'
import FtListDropdown from '../ft-list-dropdown/ft-list-dropdown.vue'
import i18n from '../../i18n/index'
import { copyToClipboard, openExternalLink } from '../../helpers/utils'

export default Vue.extend({
  name: 'PlaylistInfo',
  components: {
    'ft-list-dropdown': FtListDropdown
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
      viewCount: 0,
      lastUpdated: '',
      description: '',
      infoSource: '',
      shareValues: [
        'copyYoutube',
        'openYoutube',
        'copyInvidious',
        'openInvidious'
      ]
    }
  },
  computed: {
    hideSharingActions: function() {
      return this.$store.getters.getHideSharingActions
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    hideViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    shareHeaders: function () {
      return [
        this.$t('Playlist.Share Playlist.Copy YouTube Link'),
        this.$t('Playlist.Share Playlist.Open in YouTube'),
        this.$t('Playlist.Share Playlist.Copy Invidious Link'),
        this.$t('Playlist.Share Playlist.Open in Invidious')
      ]
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
    },
    currentLocale: function () {
      return i18n.locale.replace('_', '-')
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
    if (typeof (this.data.viewCount) !== 'undefined') {
      this.viewCount = this.hideViews ? null : Intl.NumberFormat(this.currentLocale).format(this.data.viewCount)
    }

    if (typeof (this.data.videoCount) !== 'undefined') {
      this.videoCount = Intl.NumberFormat(this.currentLocale).format(this.data.videoCount)
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
    },

    playFirstVideo() {
      const playlistInfo = {
        playlistId: this.id
      }

      this.$router.push(
        {
          path: `/watch/${this.firstVideoId}`,
          query: playlistInfo
        }
      )
    },

    goToChannel: function () {
      this.$router.push({ path: `/channel/${this.channelId}` })
    }
  }
})
