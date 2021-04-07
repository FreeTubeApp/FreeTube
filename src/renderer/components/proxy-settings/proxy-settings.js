import Vue from 'vue'
import ky from 'ky/umd'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import electron from 'electron'
import debounce from 'lodash.debounce'

export default Vue.extend({
  name: 'ProxySettings',
  components: {
    'ft-card': FtCard,
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
      proxyTestUrl: 'https://api.ipify.org?format=json',
      proxyTestUrl1: 'https://freegeoip.app/json/',
      proxyId: '',
      proxyCountry: '',
      proxyRegion: '',
      proxyCity: '',
      proxyHost: '',
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
      ]
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
    }
  },
  mounted: function () {
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
      electron.ipcRenderer.send('enableProxy', this.proxyUrl)
    },

    disableProxy: function () {
      electron.ipcRenderer.send('disableProxy')
    },

    testProxy: function () {
      this.isLoading = true
      if (!this.useProxy) {
        this.enableProxy()
      }
      ky(this.proxyTestUrl1).json()
        .then(response => {
          if (!this.useProxy) {
            this.disableProxy()
          }
          this.isLoading = false
          console.log(response)
          this.proxyIp = response.ip
          this.proxyCountry = response.country_name
          this.proxyRegion = response.region_name
          this.proxyCity = response.city
          this.dataAvailable = true
        })
        .catch(error => {
          if (!this.useProxy) {
            this.disableProxy()
          }
          this.isLoading = false
          console.log(error)
          this.showToast({
            message: this.$t('Settings.Proxy Settings["Error getting network information. Is your proxy configured properly?"]')
          })
          this.dataAvailable = false
        })
    },

    ...mapActions([
      'showToast',
      'updateUseProxy',
      'updateProxyProtocol',
      'updateProxyHostname',
      'updateProxyPort'
    ])
  }
})
