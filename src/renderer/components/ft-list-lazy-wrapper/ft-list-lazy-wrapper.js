import { defineComponent } from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtListChannel from '../ft-list-channel/ft-list-channel.vue'
import FtListPlaylist from '../ft-list-playlist/ft-list-playlist.vue'
import FtCommunityPost from '../ft-community-post/ft-community-post.vue'
import FtListHashtag from '../ft-list-hashtag/ft-list-hashtag.vue'

export default defineComponent({
  name: 'FtListLazyWrapper',
  components: {
    'ft-list-video': FtListVideo,
    'ft-list-channel': FtListChannel,
    'ft-list-playlist': FtListPlaylist,
    'ft-community-post': FtCommunityPost,
    'ft-list-hashtag': FtListHashtag,
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    dataType: {
      type: String,
      default: null,
    },
    appearance: {
      type: String,
      required: true
    },
    firstScreen: {
      type: Boolean,
      required: true
    },
    layout: {
      type: String,
      default: 'grid'
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
    playlistId: {
      type: String,
      default: null
    },
    playlistType: {
      type: String,
      default: null
    },
    playlistItemId: {
      type: String,
      default: null
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
  },
  emits: ['move-video-down', 'move-video-up', 'remove-from-playlist'],
  data: function () {
    return {
      visible: this.firstScreen
    }
  },
  computed: {
    hideLiveStreams: function() {
      return this.$store.getters.getHideLiveStreams
    },
    channelsHidden: function() {
      // Some component users like channel view will have this disabled
      if (!this.useChannelsHiddenPreference) { return [] }

      return JSON.parse(this.$store.getters.getChannelsHidden).map((ch) => {
        // Legacy support
        if (typeof ch === 'string') {
          return { name: ch, preferredName: '', icon: '' }
        }
        return ch
      })
    },
    forbiddenTitles: function() {
      if (!this.hideForbiddenTitles) { return [] }
      return JSON.parse(this.$store.getters.getForbiddenTitles)
    },
    hideUpcomingPremieres: function () {
      return this.$store.getters.getHideUpcomingPremieres
    },
    /**
     *  Show or Hide results in the list
     *
     * @return {bool} false to hide the video, true to show it
     */
    showResult: function () {
      const { data } = this
      const dataType = this.finalDataType
      if (!dataType) {
        return false
      }
      if (dataType === 'video' || dataType === 'shortVideo') {
        if (this.hideLiveStreams && (data.liveNow || data.lengthSeconds == null)) {
          // hide livestreams
          return false
        }
        if (this.hideUpcomingPremieres &&
            // Observed for premieres in Local API Channels.
            (data.premiereDate != null ||
              // Invidious API
              // `premiereTimestamp` only available on premiered videos
              // https://docs.invidious.io/api/common_types/#videoobject
              data.premiereTimestamp != null ||
             // viewCount is our only method of detecting premieres in RSS
             // data without sending an additional request.
             // If we ever get a better flag, use it here instead.
             (data.isRSS && data.viewCount === '0'))) {
          // hide upcoming
          return false
        }
        if (this.channelsHidden.some(ch => ch.name === data.authorId) || this.channelsHidden.some(ch => ch.name === data.author)) {
          // hide videos by author
          return false
        }
        if (this.forbiddenTitles.some((text) => this.data.title?.toLowerCase().includes(text.toLowerCase()))) {
          return false
        }
      } else if (dataType === 'channel') {
        const attrsToCheck = [
          // Local API
          data.id,
          data.name,
          // Invidious API
          // https://docs.invidious.io/api/common_types/#channelobject
          data.author,
          data.authorId,
        ]
        if (attrsToCheck.some(a => a != null && this.channelsHidden.some(ch => ch.name === a))) {
          // hide channels by author
          return false
        }
      } else if (dataType === 'playlist') {
        if (this.forbiddenTitles.some((text) => this.data.title?.toLowerCase().includes(text.toLowerCase()))) {
          return false
        }
        const attrsToCheck = [
          // Local API
          data.channelId,
          data.channelName,
          // Invidious API
          // https://docs.invidious.io/api/common_types/#playlistobject
          data.author,
          data.authorId,
        ]
        if (attrsToCheck.some(a => a != null && this.channelsHidden.some(ch => ch.name === a))) {
          // hide playlists by author
          return false
        }
      }
      return true
    },

    finalDataType() {
      return this.data.type ?? this.dataType
    },
  },
  methods: {
    onVisibilityChanged: function (visible) {
      this.visible = visible
    },
    moveVideoUp: function() {
      this.$emit('move-video-up')
    },

    moveVideoDown: function() {
      this.$emit('move-video-down')
    },

    removeFromPlaylist: function() {
      this.$emit('remove-from-playlist')
    },
  }
})
