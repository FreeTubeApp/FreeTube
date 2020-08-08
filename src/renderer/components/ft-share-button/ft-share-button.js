import Vue from 'vue'

import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtButton from '../ft-button/ft-button.vue'
import { mapActions } from 'vuex'

export default Vue.extend({
  name: 'FtShareButton',
  components: {
    'ft-icon-button': FtIconButton,
    'ft-button': FtButton
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  computed: {
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    invidiousURL() {
      return `${this.invidiousInstance}/watch?v=${this.id}`
    },

    invidiousEmbedURL() {
      return `${this.invidiousInstance}/embed/${this.id}`
    },

    youtubeURL() {
      return `https://www.youtube.com/watch?v=${this.id}`
    },

    youtubeEmbedURL() {
      return `https://www.youtube-nocookie.com/embed/${this.id}`
    }

  },
  methods: {
    copy(text) {
      navigator.clipboard.writeText(text)
    },

    open(url) {
      if (this.usingElectron) {
        const shell = require('electron').shell
        shell.openExternal(url)
      }
    },

    openInvidious() {
      this.open(this.invidiousURL)
      this.$refs.iconButton.toggleDropdown()
    },

    copyInvidious() {
      this.showToast({
        message: this.$t('Share.Invidious URL copied to clipboard')
      })
      this.copy(this.invidiousURL)
      this.$refs.iconButton.toggleDropdown()
    },

    openYoutube() {
      this.open(this.youtubeURL)
      this.$refs.iconButton.toggleDropdown()
    },

    copyYoutube() {
      this.showToast({
        message: this.$t('Share.YouTube URL copied to clipboard')
      })
      this.copy(this.youtubeURL)
      this.$refs.iconButton.toggleDropdown()
    },

    openYoutubeEmbed() {
      this.open(this.youtubeEmbedURL)
      this.$refs.iconButton.toggleDropdown()
    },

    copyYoutubeEmbed() {
      this.showToast({
        message: this.$t('Share.YouTube Embed URL copied to clipboard')
      })
      this.copy(this.youtubeEmbedURL)
      this.$refs.iconButton.toggleDropdown()
    },

    openInvidiousEmbed() {
      this.open(this.invidiousEmbedURL)
      this.$refs.iconButton.toggleDropdown()
    },

    copyInvidiousEmbed() {
      this.showToast({
        message: this.$t('Share.Invidious Embed URL copied to clipboard')
      })
      this.copy(this.invidiousEmbedURL)
      this.$refs.iconButton.toggleDropdown()
    },

    ...mapActions([
      'showToast'
    ])
  }
})
