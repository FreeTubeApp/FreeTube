import { defineComponent } from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import { mapActions } from 'vuex'
import { ipcRenderer } from 'electron'
import { IpcChannels } from '../../../constants'

export default defineComponent({
  name: 'DownloadSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-select': FtSelect,
    'ft-button': FtButton,
    'ft-input': FtInput
  },
  data: function () {
    return {
      askForDownloadPath: false,
      downloadBehaviorValues: [
        'download',
        'open'
      ]
    }
  },
  computed: {
    downloadPath: function() {
      return this.$store.getters.getDownloadFolderPath
    },
    downloadBehaviorNames: function () {
      return [
        this.$t('Settings.Download Settings.Download in app'),
        this.$t('Settings.Download Settings.Open in web browser')
      ]
    },
    downloadBehavior: function () {
      return this.$store.getters.getDownloadBehavior
    }
  },
  mounted: function () {
    this.askForDownloadPath = this.downloadPath === ''
  },
  methods: {
    handleDownloadingSettingChange: function (value) {
      this.askForDownloadPath = value
      if (value === true) {
        this.updateDownloadFolderPath('')
      }
    },
    chooseDownloadingFolder: async function() {
      // only use with electron
      const folder = await ipcRenderer.invoke(
        IpcChannels.SHOW_OPEN_DIALOG,
        { properties: ['openDirectory'] }
      )

      this.updateDownloadFolderPath(folder.filePaths[0])
    },
    ...mapActions([
      'updateDownloadFolderPath',
      'updateDownloadBehavior'
    ])
  }

})
