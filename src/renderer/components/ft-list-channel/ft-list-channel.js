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
    listType: function () {
      return this.$store.getters.getListType
    }
  },
  mounted: function () {
    if (typeof (this.data.avatar) !== 'undefined') {
      this.parseLocalData()
    } else {
      this.parseInvidiousData()
    }
  },
  methods: {
    parseLocalData: function () {
      this.thumbnail = this.data.avatar
      this.channelName = this.data.name
      this.id = this.data.channel_id
      this.subscriberCount = this.data.followers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      this.videoCount = this.data.videos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      this.description = this.data.description_short
    },

    parseInvidiousData: function () {
      this.thumbnail = this.data.authorThumbnails[2].url
      this.channelName = this.data.author
      this.id = this.data.authorId
      this.subscriberCount = this.data.subCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      this.videoCount = this.data.videoCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      this.description = this.data.description
    }
  }
})
