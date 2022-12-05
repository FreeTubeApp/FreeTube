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
  props: {
    currentPassword: {
      type: String,
      required: true,
    },
    hasStoredPassword: {
      type: Boolean,
      required: true
    },
    unlocked: {
      type: Boolean,
      required: true
    }
  },
  emits: ['passwordChanged'],
  data: function() {
    return {
      password: ''
    }
  },
  methods: {
    unlockSettings: function () {
      this.$emit('passwordChanged', this.password)
    },
    lockSettings: function () {
      this.password = ''
      this.$emit('passwordChanged', this.password)
    },
    setPassword: function () {
      this.setSettingsPassword(this.password)
      this.password = ''
      this.$emit('passwordChanged', this.password)
    },
    removePassword: function () {
      this.password = ''
      this.setSettingsPassword('')
      this.$emit('passwordChanged', '')
    },

    ...mapMutations([
      'setSettingsPassword'
    ]),

  }
})
