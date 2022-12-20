import { closeSync, existsSync, openSync, rmSync } from 'fs'
import Vue from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import { getUserDataPath } from '../../helpers/utils'

export default Vue.extend({
  name: 'ExperimentalSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-flex-box': FtFlexBox,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
      replaceHttpCacheLoading: true,
      replaceHttpCache: false,
      replaceHttpCachePath: '',
      showRestartPrompt: false
    }
  },
  mounted: function () {
    getUserDataPath().then((userData) => {
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
    }
  }
})
