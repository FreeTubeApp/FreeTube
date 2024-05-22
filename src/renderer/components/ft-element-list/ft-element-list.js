import { defineComponent } from 'vue'
import FtAutoGrid from '../ft-auto-grid/ft-auto-grid.vue'
import FtListLazyWrapper from '../ft-list-lazy-wrapper/ft-list-lazy-wrapper.vue'

export default defineComponent({
  name: 'FtElementList',
  components: {
    'ft-auto-grid': FtAutoGrid,
    'ft-list-lazy-wrapper': FtListLazyWrapper
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    dataType: {
      type: String,
      default: null,
    },
    display: {
      type: String,
      required: false,
      default: ''
    },
    showVideoWithLastViewedPlaylist: {
      type: Boolean,
      default: false
    },
    useChannelsHiddenPreference: {
      type: Boolean,
      default: true,
    },
    hideForbiddenTitles: {
      type: Boolean,
      default: true
    },
    searchQueryText: {
      type: String,
      required: false,
      default: '',
    },
    alwaysShowAddToPlaylistButton: {
      type: Boolean,
      default: false,
    },
    quickBookmarkButtonEnabled: {
      type: Boolean,
      default: true,
    },
    canMoveVideoUp: {
      type: Boolean,
      default: false,
    },
    canMoveVideoDown: {
      type: Boolean,
      default: false,
    },
    canRemoveFromPlaylist: {
      type: Boolean,
      default: false,
    },
    playlistItemsLength: {
      type: Number,
      default: 0
    },
    playlistId: {
      type: String,
      default: null
    },
    playlistType: {
      type: String,
      default: null
    },
  },
  emits: ['move-video-down', 'move-video-up', 'remove-from-playlist'],
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    },

    displayValue: function () {
      return this.display === '' ? this.listType : this.display
    }
  },
  methods: {
    moveVideoUp: function(videoId, playlistItemId) {
      this.$emit('move-video-up', videoId, playlistItemId)
    },

    moveVideoDown: function(videoId, playlistItemId) {
      this.$emit('move-video-down', videoId, playlistItemId)
    },

    removeFromPlaylist: function(videoId, playlistItemId) {
      this.$emit('remove-from-playlist', videoId, playlistItemId)
    },
  }
})
