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
    theme: {
      type: String,
      default: 'base'
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
  emits: ['enter-edit-mode', 'exit-edit-mode', 'search-video-query-change'],
  data: function () {
    return {
      searchVideoMode: false,
      query: '',
      updateQueryDebounce: function() {},
      editMode: false,
      showDeletePlaylistPrompt: false,
      showRemoveVideosOnWatchPrompt: false,
      showRemoveDuplicateVideosPrompt: false,
      newTitle: '',
      newDescription: '',
      deletePlaylistPromptValues: [
        'delete',
        'cancel'
      ],
    }
  },
  computed: {
    hideSharingActions: function () {
      return this.$store.getters.getHideSharingActions
    },

    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
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

    allPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },

    deletePlaylistPromptNames: function () {
      return [
        this.$t('Yes, Delete'),
        this.$t('Cancel')
      ]
    },
    removeVideosOnWatchPromptLabelText() {
      return this.$tc(
        'User Playlists.Are you sure you want to remove {playlistItemCount} watched videos from this playlist? This cannot be undone',
        this.userPlaylistWatchedVideoCount,
        { playlistItemCount: this.userPlaylistWatchedVideoCount },
      )
    },
    removeDuplicateVideosPromptLabelText() {
      return this.$tc(
        'User Playlists.Are you sure you want to remove {playlistItemCount} duplicate videos from this playlist? This cannot be undone',
        this.userPlaylistDuplicateItemCount,
        { playlistItemCount: this.userPlaylistDuplicateItemCount },
      )
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
        baseUrl = this.currentInvidiousInstanceUrl
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

    userPlaylistAnyVideoWatched() {
      if (!this.isUserPlaylist) { return false }

      const historyCacheById = this.$store.getters.getHistoryCacheById
      return this.selectedUserPlaylist.videos.some((video) => {
        return typeof historyCacheById[video.videoId] !== 'undefined'
      })
    },
    // `userPlaylistAnyVideoWatched` is faster than this & this is only needed when prompt shown
    userPlaylistWatchedVideoCount() {
      if (!this.isUserPlaylist) { return false }

      const historyCacheById = this.$store.getters.getHistoryCacheById
      return this.selectedUserPlaylist.videos.reduce((count, video) => {
        return typeof historyCacheById[video.videoId] !== 'undefined' ? count + 1 : count
      }, 0)
    },

    userPlaylistUniqueVideoIds() {
      if (!this.isUserPlaylist) { return new Set() }

      return this.selectedUserPlaylist.videos.reduce((set, video) => {
        set.add(video.videoId)
        return set
      }, new Set())
    },
    userPlaylistDuplicateItemCount() {
      if (this.userPlaylistUniqueVideoIds.size === 0) { return 0 }

      return this.selectedUserPlaylist.videos.length - this.userPlaylistUniqueVideoIds.size
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

    quickBookmarkPlaylist() {
      return this.$store.getters.getQuickBookmarkPlaylist
    },
    markedAsQuickBookmarkTarget() {
      // Only user playlists can be target
      if (this.selectedUserPlaylist == null) { return false }
      if (this.quickBookmarkPlaylist == null) { return false }

      return this.quickBookmarkPlaylist._id === this.selectedUserPlaylist._id
    },
    playlistDeletionDisabledLabel: function () {
      return this.$t('User Playlists["Cannot delete the quick bookmark target playlist."]')
    },

    inputPlaylistNameEmpty() {
      return this.newTitle === ''
    },
    inputPlaylistNameBlank() {
      return !this.inputPlaylistNameEmpty && this.newTitle.trim() === ''
    },
    inputPlaylistWithNameExists() {
      // Don't show the message with no name input
      const playlistName = this.newTitle
      const selectedUserPlaylist = this.selectedUserPlaylist
      if (this.newTitle === '') { return false }

      return this.allPlaylists.some((playlist) => {
        // Only compare with other playlists
        if (selectedUserPlaylist._id === playlist._id) { return false }

        return playlist.playlistName === playlistName
      })
    },
    playlistPersistenceDisabled() {
      return this.inputPlaylistNameEmpty || this.inputPlaylistNameBlank || this.inputPlaylistWithNameExists
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
    handlePlaylistNameInput(input) {
      if (input.trim() === '') {
        // Need to show message for blank input
        this.newTitle = input
        return
      }

      this.newTitle = input.trim()
    },

    toggleCopyVideosPrompt: function (force = false) {
      if (this.moreVideoDataAvailable && !this.isUserPlaylist && !force) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["Some videos in the playlist are not loaded yet. Click here to copy anyway."]'), 5000, () => {
          this.toggleCopyVideosPrompt(true)
        })
        return
      }

      this.showAddToPlaylistPromptForManyVideos({
        videos: this.videos,
        newPlaylistDefaultProperties: {
          title: this.channelName === '' ? this.title : `${this.title} | ${this.channelName}`,
        },
      })
    },

    savePlaylistInfo: function () {
      // Still possible to attempt to create via pressing enter
      if (this.playlistPersistenceDisabled) { return }

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

    handleQuickBookmarkEnabledDisabledClick: function () {
      showToast(this.$t('User Playlists.SinglePlaylistView.Toast["This playlist is already being used for quick bookmark."]'))
    },

    handlePlaylistDeleteDisabledClick: function () {
      showToast(this.playlistDeletionDisabledLabel)
    },

    exitEditMode: function () {
      this.editMode = false

      this.$emit('exit-edit-mode')
    },

    handleRemoveDuplicateVideosPromptAnswer(option) {
      this.showRemoveDuplicateVideosPrompt = false
      if (option !== 'delete') { return }

      const videoIdsAdded = new Set()
      const newVideoItems = this.selectedUserPlaylist.videos.reduce((ary, video) => {
        if (videoIdsAdded.has(video.videoId)) { return ary }

        ary.push(video)
        videoIdsAdded.add(video.videoId)
        return ary
      }, [])

      const removedVideosCount = this.userPlaylistDuplicateItemCount
      if (removedVideosCount === 0) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["There were no videos to remove."]'))
        return
      }

      const playlist = {
        playlistName: this.title,
        protected: this.selectedUserPlaylist.protected,
        description: this.description,
        videos: newVideoItems,
        _id: this.id,
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
    },

    handleRemoveVideosOnWatchPromptAnswer: function (option) {
      this.showRemoveVideosOnWatchPrompt = false
      if (option !== 'delete') { return }

      const videosToWatch = this.selectedUserPlaylist.videos.filter((video) => {
        return this.historyCacheById[video.videoId] == null
      })

      const removedVideosCount = this.selectedUserPlaylist.videos.length - videosToWatch.length

      if (removedVideosCount === 0) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["There were no videos to remove."]'))
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
    },

    handleDeletePlaylistPromptAnswer: function (option) {
      this.showDeletePlaylistPrompt = false
      if (option !== 'delete') { return }

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

    updateQuery(query) {
      this.query = query
      this.$emit('search-video-query-change', query)
    },

    keyboardShortcutHandler: function (event) {
      ctrlFHandler(event, this.$refs.searchInput)
    },
    ...mapActions([
      'showAddToPlaylistPromptForManyVideos',
      'updatePlaylist',
      'removePlaylist',
      'updateQuickBookmarkTargetPlaylistId',
    ]),
  },
})
