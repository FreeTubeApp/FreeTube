import Vue from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import { mapActions } from 'vuex'
import { ipcRenderer } from 'electron'
import { IpcChannels } from '../../../constants'

export default Vue.extend({
  name: 'DownloadSettings',
  components: {
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton,
    'ft-input': FtInput
  },
  data: function () {
    return {
      askForDownloadPath: this.$store.getters.getDownloadFolderPath === ''
    }
  },
  computed: {
    downloadPath: function() {
      return this.$store.getters.getDownloadFolderPath
    }
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
      'updateDownloadFolderPath'
    ])
  }

})
