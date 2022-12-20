import Vue from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'

export default Vue.extend({
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
      playlistLink: '',
      channelLink: '',
      title: 'Pop Music Playlist - Timeless Pop Songs (Updated Weekly 2020)',
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
      channelName: '#RedMusic: Just Hits',
      videoCount: 200,
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

    playlistId: function () {
      return this.playlistLink.replace('https://www.youtube.com/playlist?list=', '')
    },

    channelId: function () {
      let id = this.channelLink.replace('https://www.youtube.com/user/', '')
      id = id.replace('https://www.youtube.com/channel/', '')
      return id
    },

    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },

    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
    }
  },
  mounted: function () {
    if (typeof (this.data.owner) === 'object') {
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
      this.thumbnail = this.data.playlistThumbnail.replace('https://i.ytimg.com', this.currentInvidiousInstance).replace('hqdefault', 'mqdefault')
      this.channelName = this.data.author
      this.channelLink = this.data.authorUrl
      this.playlistLink = this.data.playlistId
      this.videoCount = this.data.videoCount

      if (this.data.proxyThumbnail === false) {
        this.thumbnail = this.data.playlistThumbnail
      }
    },

    parseLocalData: function () {
      this.title = this.data.title
      this.thumbnail = this.data.firstVideo.bestThumbnail.url
      this.channelName = this.data.owner.name
      this.channelLink = this.data.owner.url
      this.playlistLink = this.data.url
      this.videoCount = this.data.length
    },

    ...mapActions([
      'openInExternalPlayer'
    ])
  }
})
