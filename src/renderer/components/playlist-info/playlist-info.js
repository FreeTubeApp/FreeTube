import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtInput from '../ft-input/ft-input.vue'

export default defineComponent({
  name: 'PlaylistInfo',
  components: {
    'ft-share-button': FtShareButton,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-input': FtInput,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    firstVideoId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    channelThumbnail: {
      type: String,
      required: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    videoCount: {
      type: Number,
      required: true,
    },
    viewCount: {
      type: Number,
      required: true,
    },
    lastUpdated: {
      type: String,
      default: undefined,
    },
    description: {
      type: String,
      required: true,
    },
    infoSource: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      editMode: false,
      newTitle: '',
      newDescription: '',
    }
  },
  computed: {
    hideSharingActions: function () {
      return this.$store.getters.getHideSharingActions
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    hideViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    userPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },

    selectedPlaylist: function () {
      return this.userPlaylists.find((playlist) => playlist._id === this.id)
    },

    thumbnail: function () {
      let baseUrl
      if (this.backendPreference === 'invidious') {
        baseUrl = this.currentInvidiousInstance
      } else {
        baseUrl = 'https://i.ytimg.com'
      }

      switch (this.thumbnailPreference) {
        case 'start':
          return `${baseUrl}/vi/${this.firstVideoId}/mq1.jpg`
        case 'middle':
          return `${baseUrl}/vi/${this.firstVideoId}/mq2.jpg`
        case 'end':
          return `${baseUrl}/vi/${this.firstVideoId}/mq3.jpg`
        default:
          return `${baseUrl}/vi/${this.firstVideoId}/mqdefault.jpg`
      }
    },
  },
  mounted: function () {
    this.newTitle = this.title
    this.newDescription = this.description

    // Causes errors if not put inside of a check
    // if (
    //   typeof this.data.viewCount !== 'undefined' &&
    //   !isNaN(this.data.viewCount)
    // ) {
    //   this.viewCount = this.hideViews ? null : formatNumber(this.data.viewCount)
    // }
    //
    // if (
    //   typeof this.data.videoCount !== 'undefined' &&
    //   !isNaN(this.data.videoCount)
    // ) {
    //   this.videoCount = formatNumber(this.data.videoCount)
    // }
    //
    // this.lastUpdated = this.data.lastUpdated
  },
  methods: {
    savePlaylistInfo: function () {
      const playlist = {
        playlistName: this.newTitle,
        protected: this.selectedPlaylist.protected,
        removeOnWatched: this.selectedPlaylist.removeOnWatched,
        description: this.newDescription,
        videos: this.selectedPlaylist.videos,
        _id: this.id,
      }
      this.updatePlaylist(playlist)
      this.cancelEditMode()
    },

    cancelEditMode: function () {
      this.newTitle = this.title
      this.newDescription = this.description
      this.editMode = false
    },

    ...mapActions(['updatePlaylist']),
  },
})
