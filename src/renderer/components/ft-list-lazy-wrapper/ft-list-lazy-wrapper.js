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
  },
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

      let hidden = JSON.parse(this.$store.getters.getChannelsHidden)
      hidden = hidden.map((ch) => {
        if (ch instanceof String) {
          return { name: ch, secondaryName: '', description: '' }
        }
        return ch
      })
      return hidden
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
      if (!data.type) {
        return false
      }
      if (data.type === 'video' || data.type === 'shortVideo') {
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
      } else if (data.type === 'channel') {
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
      } else if (data.type === 'playlist') {
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
    }
  },
  methods: {
    onVisibilityChanged: function (visible) {
      this.visible = visible
    }

  }
})
