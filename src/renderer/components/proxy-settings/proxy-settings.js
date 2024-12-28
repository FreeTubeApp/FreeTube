import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import debounce from 'lodash.debounce'

import { IpcChannels } from '../../../constants'
import { showToast } from '../../helpers/utils'

export default defineComponent({
  name: 'ProxySettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-button': FtButton,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-loader': FtLoader,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      isLoading: false,
      dataAvailable: false,
      proxyIp: '',
      proxyCountry: '',
      proxyRegion: '',
      proxyCity: '',
      protocolNames: [
        'HTTP',
        'HTTPS',
        'SOCKS4',
        'SOCKS5'
      ],
      protocolValues: [
        'http',
        'https',
        'socks4',
        'socks5'
      ],
      debounceEnableProxy: () => { }
    }
  },
  computed: {
    useProxy: function () {
      return this.$store.getters.getUseProxy
    },
    proxyProtocol: function () {
      return this.$store.getters.getProxyProtocol
    },
    proxyHostname: function () {
      return this.$store.getters.getProxyHostname
    },
    proxyPort: function () {
      return this.$store.getters.getProxyPort
    },
    proxyUrl: function () {
      return `${this.proxyProtocol}://${this.proxyHostname}:${this.proxyPort}`
    },
    lang: function() {
      return this.$i18n.locale
    },
    localeToUse: function() {
      // locales found here: https://ipwhois.io/documentation
      const supportedLangs = ['en', 'ru', 'de', 'es', 'pt-BR', 'fr', 'zh-CN', 'ja']
      return supportedLangs.find(lang => this.lang === lang) ?? supportedLangs.find(lang => this.lang.substring(0, 2) === lang.substring(0, 2))
    },
    proxyTestUrl: function() {
      let proxyTestUrl = 'https://ipwho.is/?output=json&fields=ip,country,city,region'
      if (this.localeToUse) {
        proxyTestUrl += `&lang=${this.localeToUse}`
      }

      return proxyTestUrl
    }
  },
  created: function () {
    this.debounceEnableProxy = debounce(this.enableProxy, 200)
  },
  beforeDestroy: function () {
    if (this.proxyHostname === '') {
      this.updateProxyHostname('127.0.0.1')
    }

    if (this.proxyPort === '') {
      this.updateProxyPort('9050')
    }
  },
  methods: {
    handleUpdateProxy: function (value) {
      if (value) {
        this.enableProxy()
      } else {
        this.disableProxy()
      }
      this.updateUseProxy(value)
    },

    handleUpdateProxyProtocol: function (value) {
      if (this.useProxy) {
        this.enableProxy()
      }
      this.updateProxyProtocol(value)
    },

    handleUpdateProxyHostname: function (value) {
      if (this.useProxy) {
        this.debounceEnableProxy()
      }
      this.updateProxyHostname(value)
    },

    handleUpdateProxyPort: function (value) {
      if (this.useProxy) {
        this.debounceEnableProxy()
      }
      this.updateProxyPort(value)
    },

    enableProxy: function () {
      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.ENABLE_PROXY, this.proxyUrl)
      }
    },

    disableProxy: function () {
      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.DISABLE_PROXY)
      }

      this.dataAvailable = false
      this.proxyIp = ''
      this.proxyCountry = ''
      this.proxyRegion = ''
      this.proxyCity = ''
    },

    testProxy: function () {
      this.isLoading = true
      if (!this.useProxy) {
        this.enableProxy()
      }
      fetch(this.proxyTestUrl)
        .then((response) => response.json())
        .then((json) => {
          this.proxyIp = json.ip
          this.proxyCountry = json.country
          this.proxyRegion = json.region
          this.proxyCity = json.city
          this.dataAvailable = true
        })
        .catch((error) => {
          console.error('errored while testing proxy:', error)
          showToast(this.$t('Settings.Proxy Settings["Error getting network information. Is your proxy configured properly?"]'))
          this.dataAvailable = false
        })
        .finally(() => {
          if (!this.useProxy) {
            this.disableProxy()
          }
          this.isLoading = false
        })
    },

    ...mapActions([
      'updateUseProxy',
      'updateProxyProtocol',
      'updateProxyHostname',
      'updateProxyPort'
    ])
  }
})
