import { defineComponent } from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../ft-button/ft-button.vue'
import { useSettingsStore } from '../../stores'

export default defineComponent({
  name: 'PasswordSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-input': FtInput,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton,
  },
  setup() {
    const settingsStore = useSettingsStore()
    return { settingsStore }
  },
  data: function() {
    return {
      password: '',
    }
  },
  computed: {
    settingsPassword: function() {
      return this.settingsStore.settingsPassword
    },
    hasStoredPassword: function() {
      return this.settingsPassword !== ''
    }
  },
  methods: {
    handleSetPassword: function () {
      this.settingsStore.settingsPassword = this.password
      this.password = ''
    },
    handleRemovePassword: function () {
      this.settingsStore.settingsPassword = ''
      this.password = ''
    }
  }
})
