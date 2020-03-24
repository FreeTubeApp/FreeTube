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
      title: '',
      thumbnail: '',
      channelThumbnail: '',
      channelName: '',
      channelId: '',
      videoCount: 0,
      viewCount: 0,
      lastUpdated: '',
      description: '',
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
    listType: function () {
      return this.$store.getters.getListType
    }
  },
  mounted: function () {
    console.log(this.data)
    this.id = this.data.id
    this.title = this.data.title
    this.thumbnail = this.data.thumbnail
    this.channelName = this.data.channelName
    this.channelThumbnail = this.data.channelThumbnail
    this.uploadedTime = this.data.uploaded_at
    this.description = this.data.description

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
      const invidiousUrl = `https://invidio.us/playlist?list=${this.id}`

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
