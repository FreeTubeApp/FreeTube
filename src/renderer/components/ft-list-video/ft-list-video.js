import Vue from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtCard from '../ft-card/ft-card.vue'

export default Vue.extend({
  name: 'FtListVideo',
  components: {
    'ft-icon-button': FtIconButton,
    'ft-card': FtCard
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    playlistId: {
      type: String,
      default: null
    },
    forceListType: {
      type: String,
      default: null
    },
    appearance: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      id: '',
      title: '',
      channelName: '',
      channelId: '',
      viewCount: 0,
      uploadedTime: '',
      duration: '',
      description: '',
      watched: false,
      progressPercentage: 0,
      isLive: false,
      isFavorited: false,
      hideViews: false,
      optionsNames: [
        'Open in YouTube',
        'Copy YouTube Link',
        'Open YouTube Embedded Player',
        'Copy YouTube Embedded Player Link',
        'Open in Invidious',
        'Copy Invidious Link'
      ],
      optionsValues: [
        'openYoutube',
        'copyYoutube',
        'openYoutubeEmbed',
        'copyYoutubeEmbed',
        'openInvidious',
        'copyInvidious'
      ]
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
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

    thumbnail: function () {
      let baseUrl
      if (this.backendPreference === 'invidious') {
        baseUrl = this.invidiousInstance
      } else {
        baseUrl = 'https://i.ytimg.com'
      }

      switch (this.thumbnailPreference) {
        case 'start':
          return `${baseUrl}/vi/${this.id}/mq1.jpg`
        case 'middle':
          return `${baseUrl}/vi/${this.id}/mq2.jpg`
        case 'end':
          return `${baseUrl}/vi/${this.id}/mq3.jpg`
        default:
          return `${baseUrl}/vi/${this.id}/mqdefault.jpg`
      }
    }
  },
  mounted: function () {
    // Check if data came from Invidious or from local backend

    if (typeof (this.data.descriptionHtml) !== 'undefined' ||
      typeof (this.data.index) !== 'undefined' ||
      typeof (this.data.publishedText) !== 'undefined' ||
      typeof (this.data.authorThumbnails) === 'object'
    ) {
      this.parseInvidiousData()
    } else {
      this.parseLocalData()
    }
  },
  methods: {
    toggleSave: function () {
      console.log('TODO: ft-list-video method toggleSave')
    },

    handleOptionsClick: function (option) {
      console.log('Handling share')
      console.log(option)

      switch (option) {
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
            console.log('using electron')
            const shell = require('electron').shell
            shell.openExternal(this.invidiousUrl)
          }
          break
      }
    },

    // For Invidious data, as duration is sent in seconds
    calculateVideoDuration: function (lengthSeconds) {
      let durationText = ''
      let time = lengthSeconds
      let hours = 0

      if (time >= 3600) {
        hours = Math.floor(time / 3600)
        time = time - hours * 3600
      }

      let minutes = Math.floor(time / 60)
      let seconds = time - minutes * 60

      if (seconds < 10) {
        seconds = '0' + seconds
      }

      if (minutes < 10 && hours > 0) {
        minutes = '0' + minutes
      }

      if (hours > 0) {
        durationText = hours + ':' + minutes + ':' + seconds
      } else {
        durationText = minutes + ':' + seconds
      }

      return durationText
    },

    parseInvidiousData: function () {
      this.id = this.data.videoId
      this.title = this.data.title
      // this.thumbnail = this.data.videoThumbnails[4].url

      this.channelName = this.data.author
      this.channelId = this.data.authorId
      this.duration = this.calculateVideoDuration(this.data.lengthSeconds)
      this.description = this.data.description
      this.isLive = this.data.liveNow

      if (typeof (this.data.publishedText) !== 'undefined') {
        this.uploadedTime = this.data.publishedText
      }

      if (typeof (this.data.viewCount) !== 'undefined' && this.data.viewCount !== null) {
        this.viewCount = this.data.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      } else if (typeof (this.data.viewCountText) !== 'undefined') {
        this.viewCount = this.data.viewCountText.replace(' views', '')
      } else {
        this.hideViews = true
      }
    },

    parseLocalData: function () {
      if (typeof (this.data.id) !== 'undefined') {
        this.id = this.data.id
      } else {
        this.id = this.data.link.replace('https://www.youtube.com/watch?v=', '')
      }

      this.title = this.data.title

      if (typeof (this.data.author) === 'string') {
        this.channelName = this.data.author
        this.channelId = this.data.ucid

        // Data is returned as a literal string names 'undefined'
        if (this.data.length_seconds !== 'undefined') {
          this.duration = this.calculateVideoDuration(parseInt(this.data.length_seconds))
        }
      } else {
        this.channelName = this.data.author.name
        this.duration = this.data.duration
        this.description = this.data.description
        this.channelId = this.data.author.ref.replace('https://www.youtube.com/user/', '')
        this.channelId = this.channelId.replace('https://www.youtube.com/channel/', '')
      }

      if (typeof (this.data.uploaded_at) !== 'undefined') {
        this.uploadedTime = this.data.uploaded_at
      }

      if (this.data.views !== null && typeof (this.data.views) !== 'undefined') {
        this.viewCount = this.data.views.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      } else if (typeof (this.data.view_count) !== 'undefined') {
        const viewCount = this.data.view_count.replace(',', '')
        this.viewCount = viewCount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      } else {
        this.hideViews = true
      }

      this.isLive = this.data.live
    }
  }
})
