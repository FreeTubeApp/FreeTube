import { defineComponent } from 'vue'
import FtSubscribeButton from '../../components/ft-subscribe-button/ft-subscribe-button.vue'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { formatNumber } from '../../helpers/utils'
import { parseLocalSubscriberCount } from '../../helpers/api/local'

export default defineComponent({
  name: 'FtListChannel',
  components: {
    'ft-subscribe-button': FtSubscribeButton
  },
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
      videoCount: 0,
      formattedSubscriberCount: '',
      formattedVideoCount: '',
      handle: null,
      description: ''
    }
  },
  computed: {
    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
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
      if (this.data.subscribers != null) {
        this.subscriberCount = parseLocalSubscriberCount(this.data.subscribers.replace(/ subscriber(s)?/, ''))
        this.formattedSubscriberCount = formatNumber(this.subscriberCount)
      } else {
        this.subscriberCount = null
      }

      this.videoCount = this.data.videos ?? 0
      this.formattedVideoCount = formatNumber(this.videoCount)

      if (this.data.handle) {
        this.handle = this.data.handle
      }

      this.description = this.data.descriptionShort
    },

    parseInvidiousData: function () {
      // Can be prefixed with `https://` or `//` (protocol relative)
      const thumbnailUrl = this.data.authorThumbnails[2].url

      this.thumbnail = youtubeImageUrlToInvidious(thumbnailUrl, this.currentInvidiousInstanceUrl)

      this.channelName = this.data.author
      this.id = this.data.authorId
      this.subscriberCount = this.data.subCount
      this.formattedSubscriberCount = formatNumber(this.data.subCount)
      this.handle = this.data.channelHandle
      if (this.handle != null) {
        this.videoCount = null
      } else {
        this.videoCount = this.data.videoCount
        this.formattedVideoCount = formatNumber(this.data.videoCount)
      }
      this.description = this.data.description
    }
  }
})
