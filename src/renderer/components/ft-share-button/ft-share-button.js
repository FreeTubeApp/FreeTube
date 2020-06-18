import Vue from 'vue'

import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtButton from '../ft-button/ft-button.vue'

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
    },

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
    },

    copyInvidious() {
      this.copy(this.invidiousURL)
    },

    openYoutube() {
      this.open(this.youtubeURL)
    },

    copyYoutube() {
      this.copy(this.youtubeURL)
    },

    openYoutubeEmbed() {
      this.open(this.youtubeEmbedURL)
    },

    copyYoutubeEmbed() {
      this.copy(this.youtubeEmbedURL)
    },

    openInvidiousEmbed() {
      this.open(this.invidiousEmbedURL)
    },

    copyInvidiousEmbed() {
      this.copy(this.invidiousEmbedURL)
    },
  }
})
