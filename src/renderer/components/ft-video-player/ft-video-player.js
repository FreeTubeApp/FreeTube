import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'

// I haven't decided which video player I want to use
// Need to expirement with both of them to see which one will work best.
import videojs from 'video.js'
// import mediaelement from 'mediaelement'

export default Vue.extend({
  name: 'FtVideoPlayer',
  components: {
    'ft-card': FtCard
  },
  props: {
    data: {
      type: Array,
      default: () => { return [] }
    },
    src: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      id: '',
      player: null,
      dataSetup: {
        aspectRatio: '16:9',
        playbackRates: [
          0.25,
          0.5,
          0.75,
          1,
          1.25,
          1.5,
          1.75,
          2,
          2.25,
          2.5,
          2.75,
          3
        ]
      }
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  },
  mounted: function () {
    this.id = this._uid
    setTimeout(this.initializePlayer, 100)
  },
  methods: {
    initializePlayer: function () {
      console.log(this.id)
      const videoPlayer = document.getElementById(this.id)
      console.log(videoPlayer)
      if (videoPlayer !== null) {
        this.player = videojs(videoPlayer)
        console.log(videojs.players)
      }
    }
  }
})
