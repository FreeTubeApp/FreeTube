import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

export default defineComponent({
  name: 'ParentalControlSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch
  },
  computed: {
    hideSearchBar: function () {
      return this.$store.getters.getHideSearchBar
    },
    hideSubscribeButton: function() {
      return this.$store.getters.getHideSubscribeButton
    },
    showFamilyFriendlyOnly: function() {
      return this.$store.getters.getShowFamilyFriendlyOnly
    }
  },
  methods: {
    ...mapActions([
      'updateHideSearchBar',
      'updateHideSubscribeButton',
      'updateShowFamilyFriendlyOnly'
    ])
  }
})
