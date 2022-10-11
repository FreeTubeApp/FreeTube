import Vue from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'ParentalControlSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-card': FtCard,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-button': FtButton,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox
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
