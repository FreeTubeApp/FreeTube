import Vue from 'vue'
import { mapMutations } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../ft-button/ft-button.vue'

export default Vue.extend({
  name: 'PasswordSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton
  },
  emits: ['settingsUnlocked'],
  data: function() {
    return {
      password: '',
      unlocked: false
    }
  },
  computed: {
    getStoredPassword: function() {
      return this.$store.getters.getSettingsPassword
    },
    hasStoredPassword: function() {
      return this.getStoredPassword !== ''
    }
  },
  mounted: function () {
    this.updateUnlockStatus()
  },
  methods: {
    updateUnlockStatus: function() {
      this.unlocked = this.password === this.getStoredPassword
      this.$emit('settingsUnlocked', this.unlocked)
    },
    unlockSettings: function () {
      this.updateUnlockStatus()
    },
    lockSettings: function () {
      this.password = ''
      this.updateUnlockStatus()
    },
    setPassword: function () {
      this.setSettingsPassword(this.password)
      this.password = ''
      this.updateUnlockStatus()
    },
    removePassword: function () {
      this.setSettingsPassword('')
      this.password = ''
      this.updateUnlockStatus()
    },

    ...mapMutations([
      'setSettingsPassword'
    ]),

  }
})
