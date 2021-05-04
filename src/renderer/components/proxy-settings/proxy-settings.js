import Vue from 'vue'
import $ from 'jquery'
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

    electron.ipcRenderer.on('settings.update.updateUseProxy', (_e, value) => {
      // Update this window's state, without sending the event again
      this.updateUseProxy({
        useProxy: value,
        commitOnly: true
      })
    })
    electron.ipcRenderer.on('settings.update.updateProxyProtocol', (_e, value) => {
      // Update this window's state, without sending the event again
      this.updateProxyProtocol({
        proxyProtocol: value,
        commitOnly: true
      })
    })
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
      this.updateUseProxy({
        useProxy: value
      })
    },

    handleUpdateProxyProtocol: function (value) {
      if (this.useProxy) {
        this.enableProxy()
      }
      this.updateProxyProtocol({
        proxyProtocol: value
      })
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
      $.getJSON(this.proxyTestUrl1, (response) => {
        console.log(response)
        this.proxyIp = response.ip
        this.proxyCountry = response.country_name
        this.proxyRegion = response.region_name
        this.proxyCity = response.city
        this.dataAvailable = true
      }).fail((xhr, textStatus, error) => {
        console.log(xhr)
        console.log(textStatus)
        console.log(error)
        this.showToast({
          message: this.$t('Settings.Proxy Settings["Error getting network information. Is your proxy configured properly?"]')
        })
        this.dataAvailable = false
      }).always(() => {
        if (!this.useProxy) {
          this.disableProxy()
        }
        this.isLoading = false
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
