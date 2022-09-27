import Vue from 'vue'

import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import { mapActions } from 'vuex'

export default Vue.extend({
  name: 'FtShareButton',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-button': FtButton,
    'ft-toggle-switch': FtToggleSwitch
  },
  props: {
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
      required: true
    }
  },
  data: function () {
    return {
      includeTimestamp: false
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    invidiousURL() {
      let videoUrl = `${this.currentInvidiousInstance}/watch?v=${this.id}`
      // `playlistId` can be undefined
      if (this.playlistId && this.playlistId.length !== 0) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistId}`
      }
      return videoUrl
    },

    invidiousEmbedURL() {
      return `${this.currentInvidiousInstance}/embed/${this.id}`
    },

    youtubeURL() {
      let videoUrl = `https://www.youtube.com/watch?v=${this.id}`
      // `playlistId` can be undefined
      if (this.playlistId && this.playlistId.length !== 0) {
        // `index` seems can be ignored
        videoUrl += `&list=${this.playlistId}`
      }
      return videoUrl
    },

    youtubeShareURL() {
      // `playlistId` can be undefined
      if (this.playlistId && this.playlistId.length !== 0) {
        // `index` seems can be ignored
        return `https://www.youtube.com/watch?v=${this.id}&list=${this.playlistId}`
      }
      return `https://youtu.be/${this.id}`
    },

    youtubeEmbedURL() {
      return `https://www.youtube-nocookie.com/embed/${this.id}`
    }
  },
  methods: {

    openInvidious() {
      this.openExternalLink(this.getFinalUrl(this.invidiousURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyInvidious() {
      this.copyToClipboard({ content: this.getFinalUrl(this.invidiousURL), messageOnSuccess: this.$t('Share.Invidious URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    openYoutube() {
      this.openExternalLink(this.getFinalUrl(this.youtubeURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyYoutube() {
      this.copyToClipboard({ content: this.getFinalUrl(this.youtubeShareURL), messageOnSuccess: this.$t('Share.YouTube URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    openYoutubeEmbed() {
      this.openExternalLink(this.getFinalUrl(this.youtubeEmbedURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyYoutubeEmbed() {
      this.copyToClipboard({ content: this.getFinalUrl(this.youtubeEmbedURL), messageOnSuccess: this.$t('Share.YouTube Embed URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    openInvidiousEmbed() {
      this.openExternalLink(this.getFinalUrl(this.invidiousEmbedURL))
      this.$refs.iconButton.hideDropdown()
    },

    copyInvidiousEmbed() {
      this.copyToClipboard({ content: this.getFinalUrl(this.invidiousEmbedURL), messageOnSuccess: this.$t('Share.Invidious Embed URL copied to clipboard') })
      this.$refs.iconButton.hideDropdown()
    },

    updateIncludeTimestamp() {
      this.includeTimestamp = !this.includeTimestamp
    },

    getFinalUrl(url) {
      if (url.indexOf('?') === -1) {
        return this.includeTimestamp ? `${url}?t=${this.getTimestamp()}` : url
      }
      return this.includeTimestamp ? `${url}&t=${this.getTimestamp()}` : url
    },

    ...mapActions([
      'showToast',
      'openExternalLink',
      'copyToClipboard'
    ])
  }
})
