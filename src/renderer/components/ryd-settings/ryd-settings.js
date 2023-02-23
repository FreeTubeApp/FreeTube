import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import { getRYDInstances } from '../../helpers/returnyoutubedislike'

export default defineComponent({
  name: 'RydSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input': FtInput,
    'ft-flex-box': FtFlexBox,
  },
  computed: {
    useReturnYoutubeDislikes: function () {
      return this.$store.getters.getUseReturnYouTubeDislikes
    },
    returnYoutubeDislikesUrl: function () {
      return this.$store.getters.getReturnYouTubeDislikesUrl
    },
    returnYoutubeDislikesInstances: function() {
      return getRYDInstances()
    }
  },
  methods: {
    handleUpdateUseReturnYoutubeDislike: function (value) {
      this.updateUseReturnYouTubeDislikes(value)
    },

    handleUpdateReturnYouTubeDislikesUrl: function (value) {
      const RYDUrlWithoutTrailingSlash = value.replace(/\/$/, '')
      const RYDUrlWithoutVotesSuffix = RYDUrlWithoutTrailingSlash.replace(/\/votes$/i, '')
      this.updateReturnYouTubeDislikesUrl(RYDUrlWithoutVotesSuffix)
    },

    ...mapActions([
      'updateUseReturnYouTubeDislikes',
      'updateReturnYouTubeDislikesUrl',
    ])
  }
})
