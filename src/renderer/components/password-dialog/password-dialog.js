import { defineComponent } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtInput from '../ft-input/ft-input.vue'

export default defineComponent({
  name: 'PasswordDialog',
  components: {
    'ft-input': FtInput,
    'ft-card': FtCard
  },
  emits: ['unlocked'],
  computed: {
    settingsPassword: function () {
      return this.$store.getters.getSettingsPassword
    }
  },
  mounted: function () {
    this.$refs.password.focus()
  },
  methods: {
    handlePasswordInput: function (input) {
      if (input === this.settingsPassword) {
        this.$emit('unlocked')
      }
    }
  }
})
