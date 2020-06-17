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

    getInvidiousURL() {
      return `${this.invidiousInstance}/watch?v=${this.id}`
    },

    getInvidiousEmbedURL() {
      return `${this.invidiousInstance}/embed/${this.id}`
    },

    getYoutubeURL() {
      return `https://www.youtube.com/watch?v=${this.id}`
    },

    getYoutubeEmbedURL() {
      return `https://www.youtube-nocookie.com/embed/${this.id}`
    },

    openInvidious() {
      this.open(this.getInvidiousURL())
    },

    copyInvidious() {
      this.copy(this.getInvidiousURL())
    },

    openYoutube() {
      this.open(this.getYoutubeURL())
    },

    copyYoutube() {
      this.copy(this.getYoutubeURL())
    },

    openYoutubeEmbed() {
      this.open(this.getYoutubeEmbedURL())
    },

    copyYoutubeEmbed() {
      this.copy(this.getYoutubeEmbedURL())
    },

    openInvidiousEmbed() {
      this.open(this.getInvidiousEmbedURL())
    },

    copyInvidiousEmbed() {
      this.copy(this.getInvidiousEmbedURL())
    },
  }
})
