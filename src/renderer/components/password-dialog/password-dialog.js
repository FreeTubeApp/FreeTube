import { defineComponent } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtInput from '../ft-input/ft-input.vue'
import { useSettingsStore } from '../../stores'

export default defineComponent({
  name: 'PasswordDialog',
  components: {
    'ft-input': FtInput,
    'ft-card': FtCard
  },
  emits: ['unlocked'],
  setup() {
    const settingsStore = useSettingsStore()
    return { settingsStore }
  },
  computed: {
    settingsPassword: function () {
      return this.settingsStore.settingsPassword
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
