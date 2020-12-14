import Vue from 'vue'

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
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },
    listType: function () {
      return this.$store.getters.getListType
    },
    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
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
        this.videoCount = this.data.videos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }

      this.description = this.data.descriptionShort
    },

    parseInvidiousData: function () {
      this.thumbnail = this.data.authorThumbnails[2].url.replace('https://yt3.ggpht.com', `${this.invidiousInstance}/ggpht/`)
      this.channelName = this.data.author
      this.id = this.data.authorId
      if (this.hideChannelSubscriptions) {
        this.subscriberCount = null
      } else {
        this.subscriberCount = this.data.subCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
      this.videoCount = this.data.videoCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      this.description = this.data.description
    }
  }
})
