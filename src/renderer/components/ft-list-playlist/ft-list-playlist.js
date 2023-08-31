import { defineComponent } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'

export default defineComponent({
  name: 'FtListPlaylist',
  components: {
    'ft-icon-button': FtIconButton
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
      playlistId: '',
      channelId: '',
      title: 'Pop Music Playlist - Timeless Pop Songs (Updated Weekly 2020)',
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
      channelName: '#RedMusic: Just Hits',
      videoCount: 200,
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },

    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
    },

    blurThumbnails: function () {
      return this.$store.getters.getBlurThumbnails
    },

    blurThumbnailsStyle: function () {
      return this.blurThumbnails ? 'blur(20px)' : null
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
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
    handleExternalPlayer: function () {
      this.openInExternalPlayer({
        watchProgress: 0,
        playbackRate: this.defaultPlayback,
        videoId: null,
        playlistId: this.playlistId,
        playlistIndex: null,
        playlistReverse: null,
        playlistShuffle: null,
        playlistLoop: null
      })
    },

    parseInvidiousData: function () {
      this.title = this.data.title
      if (this.thumbnailPreference === 'hidden') {
        this.thumbnail = require('../../assets/img/thumbnail_placeholder.svg')
      } else {
        this.thumbnail = this.data.playlistThumbnail.replace('https://i.ytimg.com', this.currentInvidiousInstance).replace('hqdefault', 'mqdefault')
      }
      this.channelName = this.data.author
      this.channelId = this.data.authorId
      this.playlistId = this.data.playlistId
      this.videoCount = this.data.videoCount

      if (this.data.proxyThumbnail === false) {
        this.thumbnail = this.data.playlistThumbnail
      }
    },

    parseLocalData: function () {
      this.title = this.data.title
      if (this.thumbnailPreference === 'hidden') {
        this.thumbnail = require('../../assets/img/thumbnail_placeholder.svg')
      } else {
        this.thumbnail = this.data.thumbnail
      }
      this.channelName = this.data.channelName
      this.channelId = this.data.channelId
      this.playlistId = this.data.playlistId
      this.videoCount = this.data.videoCount
    },

    ...mapActions([
      'openInExternalPlayer'
    ])
  }
})
