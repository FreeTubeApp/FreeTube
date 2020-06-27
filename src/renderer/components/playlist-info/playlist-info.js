import Vue from 'vue'
import FtListDropdown from '../ft-list-dropdown/ft-list-dropdown.vue'
// import { shell } from 'electron'

export default Vue.extend({
  name: 'FtElementList',
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
      randomVideoId: '',
      title: '',
      channelThumbnail: '',
      channelName: '',
      channelId: '',
      videoCount: 0,
      viewCount: 0,
      lastUpdated: '',
      description: '',
      infoSource: '',
      shareHeaders: [
        'Copy YouTube Link',
        'Open in YouTube',
        'Copy Invidious Link',
        'Open in Invidious'
      ],
      shareValues: [
        'copyYoutube',
        'openYoutube',
        'copyInvidious',
        'openInvidious'
      ]
    }
  },
  computed: {
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    thumbnail: function () {
      switch (this.thumbnailPreference) {
        case 'start':
          return `https://i.ytimg.com/vi/${this.randomVideoId}/mq1.jpg`
        case 'middle':
          return `https://i.ytimg.com/vi/${this.randomVideoId}/mq2.jpg`
        case 'end':
          return `https://i.ytimg.com/vi/${this.randomVideoId}/mq3.jpg`
        default:
          return `https://i.ytimg.com/vi/${this.randomVideoId}/mqdefault.jpg`
      }
    }
  },
  mounted: function () {
    console.log(this.data)
    this.id = this.data.id
    this.randomVideoId = this.data.randomVideoId
    this.title = this.data.title
    this.channelName = this.data.channelName
    this.channelThumbnail = this.data.channelThumbnail
    this.uploadedTime = this.data.uploaded_at
    this.description = this.data.description
    this.infoSource = this.data.infoSource

    // Causes errors if not put inside of a check
    if (typeof (this.data.viewCount) !== 'undefined') {
      this.viewCount = this.data.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    if (typeof (this.data.videoCount) !== 'undefined') {
      this.videoCount = this.data.videoCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    this.lastUpdated = this.data.lastUpdated
  },
  methods: {
    sharePlaylist: function (method) {
      const youtubeUrl = `https://youtube.com/playlist?list=${this.id}`
      const invidiousUrl = `${this.invidiousInstance}/playlist?list=${this.id}`

      switch (method) {
        case 'copyYoutube':
          navigator.clipboard.writeText(youtubeUrl)
          break
        case 'openYoutube':
          // shell.openExternal(youtubeUrl)
          break
        case 'copyInvidious':
          navigator.clipboard.writeText(invidiousUrl)
          break
        case 'openInvidious':
          // shell.openExternal(invidiousUrl)
          break
      }
    }
  }
})
