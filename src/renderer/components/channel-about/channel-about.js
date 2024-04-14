import { defineComponent } from 'vue'

import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'

import { formatNumber } from '../../helpers/utils'

export default defineComponent({
  name: 'ChannelAbout',
  components: {
    'ft-channel-bubble': FtChannelBubble,
    'ft-flex-box': FtFlexBox
  },
  props: {
    description: {
      type: String,
      default: ''
    },
    joined: {
      type: [Date, Number],
      default: 0
    },
    views: {
      type: Number,
      default: null
    },
    videos: {
      type: Number,
      default: null
    },
    location: {
      type: String,
      default: null
    },
    tags: {
      type: Array,
      default: () => ([])
    },
    relatedChannels: {
      type: Array,
      default: () => ([])
    }
  },
  computed: {
    hideFeaturedChannels: function () {
      return this.$store.getters.getHideFeaturedChannels
    },

    hideSearchBar: function () {
      return this.$store.getters.getHideSearchBar
    },

    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },

    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },

    formattedJoined: function () {
      return new Intl.DateTimeFormat([this.currentLocale, 'en'], { dateStyle: 'long' }).format(this.joined)
    },

    formattedViews: function () {
      return formatNumber(this.views)
    },

    formattedVideos: function () {
      return formatNumber(this.videos)
    },
  }
})
