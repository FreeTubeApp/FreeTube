import { closeSync, existsSync, openSync, rmSync } from 'fs'
import Vue from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'

export default Vue.extend({
  name: 'ExperimentalSettings',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
      replaceHttpCacheLoading: true,
      replaceHttpCache: false,
      replaceHttpCachePath: '',
      showRestartPrompt: false,
      restartPromptValues: [
        'yes',
        'no'
      ]
    }
  },
  computed: {
    restartPromptMessage: function () {
      return this.$t('Settings["The app needs to restart for changes to take effect. Restart and apply change?"]')
    },

    restartPromptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    }
  },
  mounted: function () {
    this.getUserDataPath().then((userData) => {
      this.replaceHttpCachePath = `${userData}/experiment-replace-http-cache`

      this.replaceHttpCache = existsSync(this.replaceHttpCachePath)
      this.replaceHttpCacheLoading = false
    })
  },
  methods: {
    updateReplaceHttpCache: function () {
      this.replaceHttpCache = !this.replaceHttpCache

      if (this.replaceHttpCache) {
        // create an empty file
        closeSync(openSync(this.replaceHttpCachePath, 'w'))
      } else {
        rmSync(this.replaceHttpCachePath)
      }
    },

    handleRestartPrompt: function (value) {
      this.replaceHttpCache = value
      this.showRestartPrompt = true
    },

    handleReplaceHttpCache: function (value) {
      this.showRestartPrompt = false

      if (value === null || value === 'no') {
        this.replaceHttpCache = !this.replaceHttpCache
        return
      }

      if (this.replaceHttpCache) {
        // create an empty file
        closeSync(openSync(this.replaceHttpCachePath, 'w'))
      } else {
        rmSync(this.replaceHttpCachePath)
      }

      const { ipcRenderer } = require('electron')
      ipcRenderer.send('relaunchRequest')
    },

    ...mapActions([
      'getUserDataPath'
    ])
  }
})
