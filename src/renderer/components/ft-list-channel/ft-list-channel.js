import { defineComponent } from 'vue'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { formatNumber } from '../../helpers/utils'
import { parseLocalSubscriberCount } from '../../helpers/api/local'

export default defineComponent({
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
      parsedSubscriberCount: '',
      parsedVideoCount: '',
      handle: null,
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
    }
  },
  created: function () {
    if (this.data.dataSource === 'local') {
      this.parseLocalData()
    } else {
      this.parseInvidiousData()
    }
  },
  methods: {
    parseLocalData: function () {
      this.thumbnail = this.data.thumbnail

      if (!this.thumbnail.includes('https:')) {
        this.thumbnail = `https:${this.thumbnail}`
      }

      this.channelName = this.data.name
      this.id = this.data.id
      this.subscriberCount = null
      if (this.data.subscribers != null) {
        this.subscriberCount = parseLocalSubscriberCount(this.data.subscribers.replace(/ subscriber(s)?/, ''))
        this.parsedSubscriberCount = formatNumber(this.subscriberCount)
      }

      if (this.data.videos === null) {
        this.videoCount = 0
      } else {
        this.videoCount = this.data.videos
        this.parsedVideoCount = formatNumber(this.data.videos)
      }

      if (this.data.handle) {
        this.handle = this.data.handle
      }

      this.description = this.data.descriptionShort
    },

    parseInvidiousData: function () {
      // Can be prefixed with `https://` or `//` (protocol relative)
      const thumbnailUrl = this.data.authorThumbnails[2].url

      this.thumbnail = youtubeImageUrlToInvidious(thumbnailUrl, this.currentInvidiousInstance)

      this.channelName = this.data.author
      this.id = this.data.authorId
      this.subscriberCount = this.data.subCount
      this.parsedSubscriberCount = formatNumber(this.subscriberCount)
      this.handle = this.data.channelHandle
      if (this.handle != null) {
        this.videoCount = null
      } else {
        this.videoCount = this.data.videoCount
        this.parsedVideoCount = formatNumber(this.videoCount)
      }

      this.description = this.data.description
    }
  }
})
