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
    hideUnsubscribeButton: function() {
      return this.$store.getters.getHideUnsubscribeButton
    },
    showFamilyFriendlyOnly: function() {
      return this.$store.getters.getShowFamilyFriendlyOnly
    }
  },
  methods: {
    ...mapActions([
      'updateHideSearchBar',
      'updateHideUnsubscribeButton',
      'updateShowFamilyFriendlyOnly'
    ])
  }
})
