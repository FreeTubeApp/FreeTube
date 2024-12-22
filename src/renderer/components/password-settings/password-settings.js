import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../ft-button/ft-button.vue'

export default defineComponent({
  name: 'PasswordSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-input': FtInput,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton,
  },
  data: function() {
    return {
      password: '',
    }
  },
  computed: {
    settingsPassword: function() {
      return this.$store.getters.getSettingsPassword
    },
    hasStoredPassword: function() {
      return this.settingsPassword !== ''
    }
  },
  methods: {
    handleSetPassword: function () {
      this.updateSettingsPassword(this.password)
      this.password = ''
    },
    handleRemovePassword: function () {
      this.updateSettingsPassword('')
      this.password = ''
    },
    ...mapActions([
      'updateSettingsPassword'
    ])
  }
})
