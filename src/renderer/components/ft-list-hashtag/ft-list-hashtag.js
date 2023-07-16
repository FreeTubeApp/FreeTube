import { defineComponent } from 'vue'
import { formatNumber } from '../../helpers/utils'

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
      title: '',
      url: '',
      channelCount: 0,
      parsedChannelCount: '',
      videoCount: 0,
      parsedVideosCount: ''
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  },
  created: function () {
    this.parseData()
  },
  methods: {
    parseData: function () {
      this.url = this.data.url
      this.channelCount = this.data.channelCount
      this.parsedChannelCount = formatNumber(this.channelCount)
      this.videoCount = this.data.videoCount
      this.parsedVideosCount = formatNumber(this.videoCount)
      this.title = this.data.title
    }
  }
})
