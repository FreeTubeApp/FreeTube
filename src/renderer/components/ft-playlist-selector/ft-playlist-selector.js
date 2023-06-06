import Vue from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'

export default Vue.extend({
  name: 'FtPlaylistSelector',
  components: {
    'ft-icon-button': FtIconButton
  },
  props: {
    data: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    appearance: {
      type: String,
      default: 'grid',
    },
    selected: {
      type: Boolean,
      required: true,
    },
  },
  data: function () {
    return {
      title: '',
      thumbnail: '',
      videoCount: 0,
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    titleForDisplay: function () {
      if (typeof this.title !== 'string') { return '' }
      if (this.title.length <= 255) { return this.title }

      return `${this.title.substring(0, 255)}...`
    },
  },
  mounted: function () {
    this.parseUserData()
  },
  methods: {
    parseUserData: function () {
      this.title = this.data.playlistName
      if (this.data.videos.length > 0) {
        this.thumbnail = `https://i.ytimg.com/vi/${this.data.videos[0].videoId}/mqdefault.jpg`
      } else {
        this.thumbnail = 'https://i.ytimg.com/vi/aaaaaa/mqdefault.jpg'
      }
      this.videoCount = this.data.videos.length
    },

    toggleSelection: function () {
      this.$emit('selected', this.index)
    },

    ...mapActions([
      'openInExternalPlayer'
    ])
  }
})
