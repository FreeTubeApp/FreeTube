import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import {
  ctrlFHandler,
  formatNumber,
  showToast,
} from '../../helpers/utils'
import debounce from 'lodash.debounce'

export default defineComponent({
  name: 'PlaylistInfo',
  components: {
    'ft-share-button': FtShareButton,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-input': FtInput,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
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
    firstVideoPlaylistItemId: {
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
    searchVideoModeAllowed: {
      type: Boolean,
      required: true,
    },
    searchVideoModeEnabled: {
      type: Boolean,
      required: true,
    },
    searchQueryText: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      searchVideoMode: false,
      query: '',
      updateQueryDebounce: function() {},
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

    historyCacheById: function () {
      return this.$store.getters.getHistoryCacheById
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

    firstVideoIdExists() {
      return this.firstVideoId !== ''
    },

    parsedViewCount() {
      return formatNumber(this.viewCount)
    },

    parsedVideoCount() {
      return formatNumber(this.videoCount)
    },

    thumbnail: function () {
      if (this.thumbnailPreference === 'hidden' || !this.firstVideoIdExists) {
        return require('../../assets/img/thumbnail_placeholder.svg')
      }

      let baseUrl = 'https://i.ytimg.com'
      if (this.backendPreference === 'invidious') {
        baseUrl = this.currentInvidiousInstance
      } else if (typeof this.playlistThumbnail === 'string' && this.playlistThumbnail.length > 0) {
        // Use playlist thumbnail provided by YT when available
        return this.playlistThumbnail
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

    isUserPlaylist() {
      return this.infoSource === 'user'
    },

    videoPlaylistType() {
      return this.isUserPlaylist ? 'user' : ''
    },

    deletePlaylistButtonVisible: function() {
      if (!this.isUserPlaylist) { return false }
      // Cannot delete during edit
      if (this.editMode) { return false }

      // Cannot delete protected playlist
      return !this.selectedUserPlaylist.protected
    },

    sharePlaylistButtonVisible: function() {
      // Only online playlists can be shared
      if (this.isUserPlaylist) { return false }

      // Cannot delete protected playlist
      return !this.hideSharingActions
    },

    quickBookmarkPlaylistId() {
      return this.$store.getters.getQuickBookmarkTargetPlaylistId
    },
    quickBookmarkPlaylist() {
      return this.$store.getters.getPlaylist(this.quickBookmarkPlaylistId)
    },
    quickBookmarkEnabled() {
      return this.quickBookmarkPlaylist != null
    },
    markedAsQuickBookmarkTarget() {
      // Only user playlists can be target
      if (this.selectedUserPlaylist == null) { return false }
      if (this.quickBookmarkPlaylist == null) { return false }

      return this.quickBookmarkPlaylist._id === this.selectedUserPlaylist._id
    },
  },
  watch: {
    showDeletePlaylistPrompt(shown) {
      this.$emit(shown ? 'prompt-open' : 'prompt-close')
    },
    showRemoveVideosOnWatchPrompt(shown) {
      this.$emit(shown ? 'prompt-open' : 'prompt-close')
    },
  },
  created: function () {
    this.newTitle = this.title
    this.newDescription = this.description

    if (this.videoCount > 0) {
      // Only enable search video mode when viewing non empty playlists
      this.searchVideoMode = this.searchVideoModeEnabled
      this.query = this.searchQueryText
    }

    this.updateQueryDebounce = debounce(this.updateQuery, 500)
  },
  mounted: function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    toggleCopyVideosPrompt: function (force = false) {
      if (this.moreVideoDataAvailable && !this.isUserPlaylist && !force) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["Some videos in the playlist are not loaded yet. Click here to copy anyway."]'), 5000, () => {
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
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["Playlist name cannot be empty. Please input a name."]'))
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
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["Playlist has been updated."]'))
      } catch (e) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
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
          return this.historyCacheById[video.videoId] == null
        })

        const removedVideosCount = this.selectedUserPlaylist.videos.length - videosToWatch.length

        if (removedVideosCount === 0) {
          showToast(this.$t('User Playlists.SinglePlaylistView.Toast["There were no videos to remove."]'))
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
          showToast(this.$tc('User Playlists.SinglePlaylistView.Toast.{videoCount} video(s) have been removed', removedVideosCount, {
            videoCount: removedVideosCount,
          }))
        } catch (e) {
          showToast(this.$t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
          console.error(e)
        }
      }
      this.showRemoveVideosOnWatchPrompt = false
    },

    handleDeletePlaylistPromptAnswer: function (option) {
      if (option === 'yes') {
        if (this.selectedUserPlaylist.protected) {
          showToast(this.$t('User Playlists.SinglePlaylistView.Toast["This playlist is protected and cannot be removed."]'))
        } else {
          this.removePlaylist(this.id)
          this.$router.push(
            {
              path: '/userPlaylists'
            }
          )
          showToast(this.$t('User Playlists.SinglePlaylistView.Toast["Playlist {playlistName} has been deleted."]', {
            playlistName: this.title,
          }))
        }
      }
      this.showDeletePlaylistPrompt = false
    },

    enableQuickBookmarkForThisPlaylist() {
      const currentQuickBookmarkTargetPlaylist = this.quickBookmarkPlaylist

      this.updateQuickBookmarkTargetPlaylistId(this.id)
      if (currentQuickBookmarkTargetPlaylist != null) {
        showToast(
          this.$t('User Playlists.SinglePlaylistView.Toast["This playlist is now used for quick bookmark instead of {oldPlaylistName}. Click here to undo"]', {
            oldPlaylistName: currentQuickBookmarkTargetPlaylist.playlistName,
          }),
          5000,
          () => {
            this.updateQuickBookmarkTargetPlaylistId(currentQuickBookmarkTargetPlaylist._id)
            showToast(
              this.$t('User Playlists.SinglePlaylistView.Toast["Reverted to use {oldPlaylistName} for quick bookmark"]', {
                oldPlaylistName: currentQuickBookmarkTargetPlaylist.playlistName,
              }),
              5000,
            )
          },
        )
      } else {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast.This playlist is now used for quick bookmark'))
      }
    },
    disableQuickBookmark() {
      this.updateQuickBookmarkTargetPlaylistId(null)
      showToast(this.$t('User Playlists.SinglePlaylistView.Toast.Quick bookmark disabled'))
    },

    updateQuery(query) {
      this.query = query
      this.$emit('search-video-query-change', query)
    },

    keyboardShortcutHandler: function (event) {
      return ctrlFHandler(event, this.$refs.searchInput)
    },
    ...mapActions([
      'showAddToPlaylistPromptForManyVideos',
      'updatePlaylist',
      'removePlaylist',
      'updateQuickBookmarkTargetPlaylistId',
    ]),
  },
})
