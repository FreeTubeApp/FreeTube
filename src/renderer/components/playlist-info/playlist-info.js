import Vue from 'vue'
import { mapActions } from 'vuex'
import FtListDropdown from '../ft-list-dropdown/ft-list-dropdown.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
import FtInput from '../ft-input/ft-input.vue'

export default Vue.extend({
  name: 'PlaylistInfo',
  components: {
    'ft-list-dropdown': FtListDropdown,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-share-button': FtShareButton,
    'ft-input': FtInput
  },
  props: {
    id: {
      type: String,
      required: true
    },
    firstVideoId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true
    },
    videoCount: {
      type: Number,
      required: true
    },
    viewCount: {
      type: Number,
      required: true
    },
    lastUpdated: {
      type: String,
      default: undefined
    },
    description: {
      type: String,
      required: true
    },
    infoSource: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      editMode: false,
      newTitle: '',
      newDescription: '',
      shareValues: [
        'copyYoutube',
        'openYoutube',
        'copyInvidious',
        'openInvidious'
      ]
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    listType: function () {
      return this.$store.getters.getListType
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    userPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },

    selectedPlaylist: function () {
      return this.userPlaylists.find(playlist => playlist._id === this.id)
    },

    shareHeaders: function () {
      return [
        this.$t('Playlist.Share Playlist.Copy YouTube Link'),
        this.$t('Playlist.Share Playlist.Open in YouTube'),
        this.$t('Playlist.Share Playlist.Copy Invidious Link'),
        this.$t('Playlist.Share Playlist.Open in Invidious')
      ]
    },

    thumbnail: function () {
      switch (this.thumbnailPreference) {
        case 'start':
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mq1.jpg`
        case 'middle':
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mq2.jpg`
        case 'end':
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mq3.jpg`
        default:
          return `https://i.ytimg.com/vi/${this.firstVideoId}/mqdefault.jpg`
      }
    }
  },
  mounted: function () {
    this.newTitle = this.title
    this.newDescription = this.description
    // Causes errors if not put inside of a check
    /* if (typeof (this.data.viewCount) !== 'undefined') {
      this.viewCount = this.data.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    } */
  },
  methods: {
    sharePlaylist: function (method) {
      const youtubeUrl = `https://youtube.com/playlist?list=${this.id}`
      const invidiousUrl = `${this.currentInvidiousInstance}/playlist?list=${this.id}`

      switch (method) {
        case 'copyYoutube':
          navigator.clipboard.writeText(youtubeUrl)
          this.showToast({
            message: this.$t('Share.YouTube URL copied to clipboard')
          })
          break
        case 'openYoutube':
          this.openExternalLink(youtubeUrl)
          break
        case 'copyInvidious':
          navigator.clipboard.writeText(invidiousUrl)
          this.showToast({
            message: this.$t('Share.Invidious URL copied to clipboard')
          })
          break
        case 'openInvidious':
          this.openExternalLink(invidiousUrl)
          break
      }
    },

    playFirstVideo() {
      const playlistInfo = {
        playlistId: this.id
      }

      this.$router.push(
        {
          path: `/watch/${this.firstVideoId}`,
          query: playlistInfo
        }
      )
    },

    goToChannel: function () {
      this.$router.push({ path: `/channel/${this.channelId}` })
    },

    savePlaylistInfo: function () {
      const playlist = {
        playlistName: this.newTitle,
        protected: this.selectedPlaylist.protected,
        removeOnWatched: this.selectedPlaylist.removeOnWatched,
        description: this.newDescipriton,
        videos: this.selectedPlaylist.videos,
        _id: this.id
      }
      this.updatePlaylist(playlist)
      this.cancelEditMode()
    },

    cancelEditMode: function () {
      this.newTitle = this.title
      this.newDescription = this.description
      this.editMode = false
    },

    ...mapActions([
      'showToast',
      'openExternalLink',
      'updatePlaylist'
    ])
  }
})
