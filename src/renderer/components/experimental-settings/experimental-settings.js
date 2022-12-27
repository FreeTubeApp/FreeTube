import fs from 'fs/promises'
import Vue from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import { pathExists } from '../../helpers/filesystem'
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

      pathExists(this.replaceHttpCachePath).then((exists) => {
        this.replaceHttpCache = exists
        this.replaceHttpCacheLoading = false
      })
    })
  },
  methods: {
    handleRestartPrompt: function (value) {
      this.replaceHttpCache = value
      this.showRestartPrompt = true
    },

    handleReplaceHttpCache: async function (value) {
      this.showRestartPrompt = false

      if (value === null || value === 'no') {
        this.replaceHttpCache = !this.replaceHttpCache
        return
      }

      if (this.replaceHttpCache) {
        // create an empty file
        const handle = await fs.open(this.replaceHttpCachePath, 'w')
        await handle.close()
      } else {
        await fs.rm(this.replaceHttpCachePath)
      }

      const { ipcRenderer } = require('electron')
      ipcRenderer.send('relaunchRequest')
    }
  }
})
