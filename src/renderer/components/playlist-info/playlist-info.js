import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import {
  showToast,
} from '../../helpers/utils'

export default defineComponent({
  name: 'PlaylistInfo',
  components: {
    'ft-share-button': FtShareButton,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-input': FtInput,
    'ft-prompt': FtPrompt,
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
    playlistThumbnail: {
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
      default: null,
    },
    videoCount: {
      type: Number,
      required: true,
    },
    videos: {
      type: Array,
      required: true
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
    moreVideoDataAvailable: {
      type: Boolean,
      required: true,
    },
  },
  data: function () {
    return {
      editMode: false,
      showDeletePlaylistPrompt: false,
      showRemoveVideosOnWatchPrompt: false,
      newTitle: '',
      newDescription: '',
      deletePlaylistPromptValues: [
        'yes',
        'no'
      ],
    }
  },
  computed: {
    hideSharingActions: function () {
      return this.$store.getters.getHideSharingActions
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },

    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    blurThumbnails: function () {
      return this.$store.getters.getBlurThumbnails
    },

    blurThumbnailsStyle: function () {
      return this.blurThumbnails ? 'blur(20px)' : null
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    hideViews: function () {
      return this.$store.getters.getHideVideoViews
    },

    showPlaylists: function () {
      return !this.$store.getters.getHidePlaylists
    },

    selectedUserPlaylist: function () {
      return this.$store.getters.getPlaylist(this.id)
    },

    deletePlaylistPromptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    },

    thumbnail: function () {
      if (this.thumbnailPreference === 'hidden') {
        return require('../../assets/img/thumbnail_placeholder.svg')
      }

      let baseUrl = 'https://i.ytimg.com'
      if (this.backendPreference === 'invidious') {
        baseUrl = this.currentInvidiousInstance
      } else if (typeof this.playlistThumbnail === 'string' && this.playlistThumbnail.length > 0) {
        // Use playlist thumbnail provided by YT when available
        return this.data.playlistThumbnail
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

    deletePlaylistButtonVisible: function() {
      if (this.infoSource !== 'user') { return false }
      // Cannot delete during edit
      if (this.editMode) { return false }

      // Cannot delete protected playlist
      return !this.selectedUserPlaylist.protected
    },

    sharePlaylistButtonVisible: function() {
      // Only online playlists can be shared
      if (this.infoSource === 'user') { return false }

      // Cannot delete protected playlist
      return !this.hideSharingActions
    },
  },
  mounted: function () {
    this.newTitle = this.title
    this.newDescription = this.description
  },
  methods: {
    toggleCopyVideosPrompt: function (force = false) {
      if (this.moreVideoDataAvailable && !force) {
        showToast('Some videos in the playlist are not loaded yet. Click here to copy anyway.', 5000, () => {
          this.toggleCopyVideosPrompt(true)
        })
        return
      }

      this.showAddToPlaylistPromptForManyVideos({
        videos: this.videos,
        newPlaylistDefaultProperties: { title: this.title },
      })
    },

    savePlaylistInfo: function () {
      if (this.newTitle === '') {
        showToast('Playlist name cannot be empty. Please input a name.')
        return
      }

      const playlist = {
        playlistName: this.newTitle,
        protected: this.selectedUserPlaylist.protected,
        description: this.newDescription,
        videos: this.selectedUserPlaylist.videos,
        _id: this.id,
      }
      try {
        this.updatePlaylist(playlist)
        showToast('Playlist has been updated.')
      } catch (e) {
        showToast('There was an issue with updating this playlist.')
        console.error(e)
      } finally {
        this.exitEditMode()
      }
    },

    enterEditMode: function () {
      this.newTitle = this.title
      this.newDescription = this.description
      this.editMode = true

      this.$emit('enter-edit-mode')

      nextTick(() => {
        // Some elements only present after rendering update
        this.$refs.playlistTitleInput.focus()
      })
    },

    exitEditMode: function () {
      this.editMode = false

      this.$emit('exit-edit-mode')
    },

    handleRemoveVideosOnWatchPromptAnswer: function (option) {
      if (option === 'yes') {
        const videosToWatch = this.selectedUserPlaylist.videos.filter((video) => {
          const watchedIndex = this.historyCache.findIndex((history) => {
            return history.videoId === video.videoId
          })

          return watchedIndex === -1
        })

        const videosRemoved = this.selectedUserPlaylist.videos.length - videosToWatch.length

        if (videosRemoved === 0) {
          showToast('There were no videos to remove.')
          this.showRemoveVideosOnWatchPrompt = false
          return
        }

        const playlist = {
          playlistName: this.title,
          protected: this.selectedUserPlaylist.protected,
          description: this.description,
          videos: videosToWatch,
          _id: this.id
        }
        try {
          this.updatePlaylist(playlist)
          showToast(`${videosRemoved} video(s) have been removed.`)
        } catch (e) {
          showToast('There was an issue with updating this playlist.')
          console.error(e)
        }
      }
      this.showRemoveVideosOnWatchPrompt = false
    },

    handleDeletePlaylistPromptAnswer: function (option) {
      if (option === 'yes') {
        if (this.selectedUserPlaylist.protected) {
          showToast('This playlist is protected and cannot be removed.')
        } else {
          this.removePlaylist(this.id)
          this.$router.push(
            {
              path: '/userPlaylists'
            }
          )
          showToast(`${this.title} has been deleted.`)
        }
      }
      this.showDeletePlaylistPrompt = false
    },

    ...mapActions([
      'showAddToPlaylistPromptForManyVideos',
      'updatePlaylist',
      'removePlaylist',
    ]),
  },
})
