import Vue from 'vue'
import { mapMutations } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'

export default Vue.extend({
  name: 'PasswordSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton,
    'ft-prompt': FtPrompt,
  },
  emits: ['settingsUnlocked'],
  data: function() {
    return {
      password: '',
      unlocked: false,
      showIncorrectPassword: false
    }
  },
  computed: {
    getStoredPassword: function() {
      return this.$store.getters.getSettingsPassword
    },
    hasStoredPassword: function() {
      return this.getStoredPassword !== ''
    },
    incorrectPassword: function() {
      return this.password !== '' && !this.unlocked
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
      this.showIncorrectPassword = !this.unlocked
    },
    lockSettings: function () {
      this.password = ''
      this.updateUnlockStatus()
      this.showIncorrectPassword = false
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
