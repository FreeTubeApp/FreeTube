import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import { useSettingsStore } from '../../stores'

export default defineComponent({
  name: 'ParentalControlSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch
  },
  setup() {
    const settingsStore = useSettingsStore()
    return { settingsStore }
  },
  computed: {
    hideSearchBar: function () {
      return this.settingsStore.hideSearchBar
    },
    hideUnsubscribeButton: function() {
      return this.settingsStore.hideUnsubscribeButton
    },
    showFamilyFriendlyOnly: function() {
      return this.settingsStore.showFamilyFriendlyOnly
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
