import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtListDropdown from '../ft-list-dropdown/ft-list-dropdown.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
// import { shell } from 'electron'

export default Vue.extend({
  name: 'WatchVideoInfo',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-list-dropdown': FtListDropdown,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton
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
    }
  },
  data: function () {
    return {
      formatTypeLabel: 'VIDEO FORMATS',
      formatTypeNames: [
        'USE DASH FORMATS',
        'USE LEGACY FORMATS',
        'USE AUDIO FORMATS'
      ],
      formatTypeValues: [
        'dash',
        'legacy',
        'audio'
      ],
      shareLabel: 'SHARE VIDEO',
      shareNames: [
        'COPY INVIDIOUS LINK',
        'OPEN INVIDIOUS LINK',
        'COPY YOUTUBE LINK',
        'OPEN YOUTUBE LINK'
      ],
      shareValues: [
        'copyInvidious',
        'openInvidious',
        'copyYoutube',
        'openYoutube'
      ]
    }
  },
  computed: {
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    invidiousUrl: function () {
      return `${this.invidiousInstance}/watch?v=${this.id}`
    },

    youtubeUrl: function () {
      return `https://www.youtube.com/watch?v=${this.id}`
    },

    youtubeEmbedUrl: function () {
      return `https://www.youtube-nocookie.com/embed/${this.id}`
    },

    totalLikeCount: function () {
      return this.likeCount + this.dislikeCount
    },

    likePercentageRatio: function () {
      return parseInt(this.likeCount / this.totalLikeCount * 100)
    },

    parsedViewCount: function () {
      return this.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' views'
    },

    subscribedText: function () {
      return `SUBSCRIBE ${this.subscriptionCountText}`
    }
  },
  methods: {
    goToChannel: function () {
      this.$router.push({ path: `/channel/${this.channelId}` })
    },

    handleSubscription: function () {
      console.log('TODO: Handle subscription logic')
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

    handleShare: function (method) {
      console.log('Handling share')

      switch (method) {
        case 'copyYoutube':
          navigator.clipboard.writeText(this.youtubeUrl)
          break
        case 'openYoutube':
          if (this.usingElectron) {
            const shell = require('electron').shell
            shell.openExternal(this.youtubeUrl)
          }
          break
        case 'copyYoutubeEmbed':
          navigator.clipboard.writeText(this.youtubeEmbedUrl)
          break
        case 'openYoutubeEmbed':
          if (this.usingElectron) {
            const shell = require('electron').shell
            shell.openExternal(this.youtubeEmbedUrl)
          }
          break
        case 'copyInvidious':
          navigator.clipboard.writeText(this.invidiousUrl)
          break
        case 'openInvidious':
          if (this.usingElectron) {
            const shell = require('electron').shell
            shell.openExternal(this.invidiousUrl)
          }
          break
      }
    }
  }
})
