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
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    appearance: {
      type: String,
      default: 'grid'
    }
  },
  data: function () {
    return {
      title: '',
      thumbnail: '',
      playlistId: '',
      videoCount: 0,
      selected: false
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    }
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
      this.playlistLink = this.data._id
      this.videoCount = this.data.videoCount ? this.data.videoCount : this.data.videos.length
    },

    toggleSelection: function () {
      this.selected = !this.selected
      this.$emit('selected', this.index)
    },

    ...mapActions([
      'openInExternalPlayer'
    ])
  }
})
