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

// FIXME: Missing web logic branching

import { ipcRenderer } from 'electron'
import debounce from 'lodash.debounce'

import { IpcChannels } from '../../../constants'

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
      proxyTestUrl: 'https://ipwho.is/',
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
      ipcRenderer.send(IpcChannels.ENABLE_PROXY, this.proxyUrl)
    },

    disableProxy: function () {
      ipcRenderer.send(IpcChannels.DISABLE_PROXY)
    },

    testProxy: function () {
      this.isLoading = true
      if (!this.useProxy) {
        this.enableProxy()
      }
      $.getJSON(this.proxyTestUrl, (response) => {
        console.log(response)
        this.proxyIp = response.ip
        this.proxyCountry = response.country
        this.proxyRegion = response.region
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
