import Vue from 'vue'
import i18n from '../../i18n/index'

export default Vue.extend({
  name: 'FtListChannel',
  props: {
    data: {
      type: Object,
      required: true
    },
    appearance: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      id: '',
      thumbnail: '',
      channelName: '',
      subscriberCount: 0,
      videoCount: '',
      uploadedTime: '',
      description: ''
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    listType: function () {
      return this.$store.getters.getListType
    },
    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    },
    currentLocale: function () {
      return i18n.locale.replace('_', '-')
    }
  },
  mounted: function () {
    if (typeof (this.data.avatars) !== 'undefined') {
      this.parseLocalData()
    } else {
      this.parseInvidiousData()
    }
  },
  methods: {
    parseLocalData: function () {
      this.thumbnail = this.data.bestAvatar.url

      if (!this.thumbnail.includes('https:')) {
        this.thumbnail = `https:${this.thumbnail}`
      }

      this.channelName = this.data.name
      this.id = this.data.channelID
      if (this.hideChannelSubscriptions || this.data.subscribers === null) {
        this.subscriberCount = null
      } else {
        this.subscriberCount = this.data.subscribers.replace(/ subscriber(s)?/, '')
      }
      if (this.data.videos === null) {
        this.videoCount = 0
      } else {
        this.videoCount = Intl.NumberFormat(this.currentLocale).format(this.data.videos)
      }

      this.description = this.data.descriptionShort
    },

    parseInvidiousData: function () {
      // Can be prefixed with `https://` or `//` (protocol relative)
      let thumbnailUrl = this.data.authorThumbnails[2].url

      // Update protocol relative URL to be prefixed with `https://`
      if (thumbnailUrl.startsWith('//')) {
        thumbnailUrl = `https:${thumbnailUrl}`
      }

      this.thumbnail = thumbnailUrl.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)

      this.channelName = this.data.author
      this.id = this.data.authorId
      if (this.hideChannelSubscriptions) {
        this.subscriberCount = null
      } else {
        this.subscriberCount = Intl.NumberFormat(this.currentLocale).format(this.data.subCount)
      }
      this.videoCount = Intl.NumberFormat(this.currentLocale).format(this.data.videoCount)
      this.description = this.data.description
    }
  }
})
