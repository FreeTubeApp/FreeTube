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
    },
    searchQueryText: {
      type: String,
      required: false,
      default: '',
    },
  },
  data: function () {
    return {
      playlistId: '',
      channelId: '',
      title: 'Pop Music Playlist - Timeless Pop Songs (Updated Weekly 2020)',
      thumbnail: require('../../assets/img/thumbnail_placeholder.svg'),
      channelName: '#RedMusic: Just Hits',
      videoCount: 200,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
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

    titleForDisplay: function () {
      if (typeof this.title !== 'string') { return '' }
      if (this.title.length <= 255) { return this.title }

      return `${this.title.substring(0, 255)}...`
    },

    blurThumbnails: function () {
      return this.$store.getters.getBlurThumbnails
    },

    blurThumbnailsStyle: function () {
      return this.blurThumbnails ? 'blur(20px)' : null
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },
    thumbnailCanBeShown() {
      return this.thumbnailPreference !== 'hidden'
    },

    isUserPlaylist() {
      return this.data._id != null
    },

    playlistPageLinkTo() {
      // For `router-link` attribute `to`
      return {
        path: `/playlist/${this.playlistId}`,
        query: {
          playlistType: this.isUserPlaylist ? 'user' : '',
          searchQueryText: this.searchQueryText,
        },
      }
    },
  },
  created: function () {
    if (this.isUserPlaylist) {
      this.parseUserData()
    } else if (this.data.dataSource === 'local') {
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
      if (this.thumbnailCanBeShown) {
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
      if (this.thumbnailCanBeShown) {
        this.thumbnail = this.data.thumbnail
      }
      this.channelName = this.data.channelName
      this.channelId = this.data.channelId
      this.playlistId = this.data.playlistId
      this.videoCount = this.data.videoCount
    },

    parseUserData: function () {
      this.title = this.data.playlistName
      if (this.thumbnailCanBeShown && this.data.videos.length > 0) {
        const thumbnailURL = `https://i.ytimg.com/vi/${this.data.videos[0].videoId}/mqdefault.jpg`
        if (this.backendPreference === 'invidious') {
          this.thumbnail = thumbnailURL.replace('https://i.ytimg.com', this.currentInvidiousInstance)
        } else {
          this.thumbnail = thumbnailURL
        }
      }
      this.channelName = ''
      this.channelId = ''
      this.playlistId = this.data._id
      this.videoCount = this.data.videos.length
    },

    ...mapActions([
      'openInExternalPlayer'
    ])
  }
})
