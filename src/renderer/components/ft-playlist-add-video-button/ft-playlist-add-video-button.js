import { defineComponent } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'

export default defineComponent({
  name: 'FtPlaylistAddVideoButton',
  components: {
    'ft-icon-button': FtIconButton,
  },
  props: {
    videoId: {
      type: String,
      required: true
    },
    videoTitle: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    viewCount: {
      type: Number,
      required: true
    },
    lengthSeconds: {
      type: Number,
      required: true
    },

    padding: {
      type: Number,
      default: 10
    },
    size: {
      type: Number,
      default: 20
    },
  },
  methods: {
    togglePlaylistPrompt: function () {
      const videoData = {
        videoId: this.videoId,
        title: this.videoTitle,
        author: this.channelName,
        authorId: this.channelId,
        viewCount: this.viewCount,
        lengthSeconds: this.lengthSeconds,
      }

      this.showAddToPlaylistPromptForManyVideos({ videos: [videoData] })
    },

    ...mapActions([
      'showAddToPlaylistPromptForManyVideos',
    ])
  },
})
