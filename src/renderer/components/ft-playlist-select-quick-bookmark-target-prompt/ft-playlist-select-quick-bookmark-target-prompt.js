import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtPlaylistSelectionPrompt from '../../components/ft-playlist-selection-prompt/ft-playlist-selection-prompt.vue'

export default defineComponent({
  name: 'FtPlaylistSelectQuickBookmarkTargetPrompt',
  components: {
    'ft-playlist-selection-prompt': FtPlaylistSelectionPrompt,
  },
  methods: {
    hide: function () {
      this.hideSelectQuickBookmarkTargetPrompt()
    },

    async handlePlaylistSelected (playlistId) {
      // Hide AFTER quick bookmark target saved
      // Prompt close callbacks rely on that state being actually updated
      await this.updateQuickBookmarkTargetPlaylistId(playlistId)
      this.hide()
    },

    ...mapActions([
      'hideSelectQuickBookmarkTargetPrompt',

      'updateQuickBookmarkTargetPlaylistId',
    ])
  }
})
