import { defineComponent } from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import { IpcChannels } from '../../../constants'

export default defineComponent({
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
      showRestartPrompt: false
    }
  },
  mounted: async function () {
    if (process.env.IS_ELECTRON) {
      const { ipcRenderer } = require('electron')
      this.replaceHttpCache = await ipcRenderer.invoke(IpcChannels.GET_REPLACE_HTTP_CACHE)
    }

    this.replaceHttpCacheLoading = false
  },
  methods: {
    handleRestartPrompt: function (value) {
      this.replaceHttpCache = value
      this.showRestartPrompt = true
    },

    handleReplaceHttpCache: function (value) {
      this.showRestartPrompt = false

      if (value === null || value === 'cancel') {
        this.replaceHttpCache = !this.replaceHttpCache
        return
      }

      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.TOGGLE_REPLACE_HTTP_CACHE)
      }
    }
  }
})
