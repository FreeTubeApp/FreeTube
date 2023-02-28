import { defineComponent } from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import { copyToClipboard, openExternalLink } from '../../helpers/utils'

export default defineComponent({
  name: 'FtShareButton',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-button': FtButton,
    'ft-toggle-switch': FtToggleSwitch
  },
  props: {
    shareTargetType: {
      /**
       * Allows to render the dropdown conditionally
       * 'Channel' will exclude embed links
       * 'Video' (default) keeps the original behaviour
       **/
      type: String,
      default: 'Video'
    },
    id: {
      type: String,
      required: true
    },
    playlistId: {
      type: String,
      default: ''
    },
    getTimestamp: {
      type: Function,
      default: null
    },
    dropdownPositionY: {
      type: String,
      default: 'bottom'
    }
  },
  data: function () {
    return {
      includeTimestamp: false
    }
  },
  computed: {
    isChannel: function() {
      return this.shareTargetType === 'Channel'
    },

    isPlaylist: function () {
      return this.shareTargetType === 'Playlist'
    },

    isVideo: function() {
      return this.shareTargetType === 'Video'
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    invidiousURL() {
      if (this.isChannel) {
        return `${this.currentInvidiousInstance}/channel/${this.id}`
      }
      if (this.isPlaylist) {
        return `${this.currentInvidiousInstance}/playlist?list=${this.id}`
      }
      let videoUrl = `${this.currentInvidiousInstance}/watch?v=${this.id}`
      // `playlistId` can be undefined
      if (this.playlistId && this.playlistId.length !== 0) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistId}`
      }
      return videoUrl
    },

    invidiousEmbedURL() {
      if (this.isPlaylist) {
        return `${this.currentInvidiousInstance}/embed/videoseries?list=${this.id}`
      }
      return `${this.currentInvidiousInstance}/embed/${this.id}`
    },

    youtubeChannelUrl() {
      return `https://www.youtube.com/channel/${this.id}`
    },

    youtubePlaylistUrl() {
      return `https://youtube.com/playlist?list=${this.id}`
    },

    youtubeURL() {
      if (this.isChannel) {
        return this.youtubeChannelUrl
      }
      if (this.isPlaylist) {
        return this.youtubePlaylistUrl
      }
      let videoUrl = `https://www.youtube.com/watch?v=${this.id}`
      // `playlistId` can be undefined
      if (this.playlistId && this.playlistId.length !== 0) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistId}`
      }
      return videoUrl
    },

    youtubeShareURL() {
      if (this.isChannel) {
        return this.youtubeChannelUrl
      }
      if (this.isPlaylist) {
        return this.youtubePlaylistUrl
      }
      // `playlistId` can be undefined
      if (this.playlistId && this.playlistId.length !== 0) {
        // `index` seems can be ignored
        return `https://www.youtube.com/watch?v=${this.id}&list=${this.playlistId}`
      }
      return `https://youtu.be/${this.id}`
    },

    youtubeEmbedURL() {
      if (this.isPlaylist) {
        return `https://www.youtube-nocookie.com/embed/videoseries?list=${this.id}`
      }
      return `https://www.youtube-nocookie.com/embed/${this.id}`
    }
  },
  mounted() {
    // Prevents to instantiate a ft-share-button for a video without a get-timestamp function
    if (this.isVideo && !this.getTimestamp) {
      console.error('Error in props validation: A Video ft-share-button requires a valid get-timestamp function.')
    }
  },
  methods: {

    openInvidious() {
      openExternalLink(this.getFinalUrl(this.invidiousURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyInvidious() {
      copyToClipboard(this.getFinalUrl(this.invidiousURL), { messageOnSuccess: this.$t('Share.Invidious URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    openYoutube() {
      openExternalLink(this.getFinalUrl(this.youtubeURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyYoutube() {
      copyToClipboard(this.getFinalUrl(this.youtubeShareURL), { messageOnSuccess: this.$t('Share.YouTube URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    openYoutubeEmbed() {
      openExternalLink(this.getFinalUrl(this.youtubeEmbedURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyYoutubeEmbed() {
      copyToClipboard(this.getFinalUrl(this.youtubeEmbedURL), { messageOnSuccess: this.$t('Share.YouTube Embed URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    openInvidiousEmbed() {
      openExternalLink(this.getFinalUrl(this.invidiousEmbedURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyInvidiousEmbed() {
      copyToClipboard(this.getFinalUrl(this.invidiousEmbedURL), { messageOnSuccess: this.$t('Share.Invidious Embed URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    updateIncludeTimestamp() {
      this.includeTimestamp = !this.includeTimestamp
    },

    getFinalUrl(url) {
      if (this.isChannel || this.isPlaylist) {
        return url
      }
      if (url.indexOf('?') === -1) {
        return this.includeTimestamp ? `${url}?t=${this.getTimestamp()}` : url
      }
      return this.includeTimestamp ? `${url}&t=${this.getTimestamp()}` : url
    }
  }
})
