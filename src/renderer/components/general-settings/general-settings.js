import Vue from 'vue'
import $ from 'jquery'
import { mapActions } from 'vuex'
import { app } from '@electron/remote'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import debounce from 'lodash.debounce'

export default Vue.extend({
  name: 'GeneralSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      showInvidiousInstances: false,
      instanceNames: [],
      instanceValues: [],
      currentLocale: '',
      backendValues: [
        'invidious',
        'local'
      ],
      defaultPageNames: [
        'Subscriptions',
        'Trending',
        'Most Popular',
        'Playlists',
        'History'
      ],
      defaultPageValues: [
        'subscriptions',
        'trending',
        'mostPopular',
        'playlists',
        'history'
      ],
      viewTypeValues: [
        'grid',
        'list'
      ],
      thumbnailTypeValues: [
        '',
        'start',
        'middle',
        'end'
      ]
    }
  },
  computed: {
    isDev: function () {
      return process.env.NODE_ENV === 'development'
    },
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },
    enableSearchSuggestions: function () {
      return this.$store.getters.getEnableSearchSuggestions
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    checkForUpdates: function () {
      return this.$store.getters.getCheckForUpdates
    },
    checkForBlogPosts: function () {
      return this.$store.getters.getCheckForBlogPosts
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    landingPage: function () {
      return this.$store.getters.getLandingPage
    },
    region: function () {
      return this.$store.getters.getRegion
    },
    listType: function () {
      return this.$store.getters.getListType
    },
    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },
    regionNames: function () {
      return this.$store.getters.getRegionNames
    },
    regionValues: function () {
      return this.$store.getters.getRegionValues
    },

    localeOptions: function () {
      return ['system'].concat(Object.keys(this.$i18n.messages))
    },

    localeNames: function () {
      const names = [
        this.$t('Settings.General Settings.System Default')
      ]

      Object.keys(this.$i18n.messages).forEach((locale) => {
        const localeName = this.$i18n.messages[locale]['Locale Name']
        if (typeof localeName !== 'undefined') {
          names.push(localeName)
        } else {
          names.push(locale)
        }
      })

      return names
    },

    backendNames: function () {
      return [
        this.$t('Settings.General Settings.Preferred API Backend.Invidious API'),
        this.$t('Settings.General Settings.Preferred API Backend.Local API')
      ]
    },

    viewTypeNames: function () {
      return [
        this.$t('Settings.General Settings.Video View Type.Grid'),
        this.$t('Settings.General Settings.Video View Type.List')
      ]
    },

    thumbnailTypeNames: function () {
      return [
        this.$t('Settings.General Settings.Thumbnail Preference.Default'),
        this.$t('Settings.General Settings.Thumbnail Preference.Beginning'),
        this.$t('Settings.General Settings.Thumbnail Preference.Middle'),
        this.$t('Settings.General Settings.Thumbnail Preference.End')
      ]
    }
  },
  mounted: function () {
    const requestUrl = 'https://api.invidious.io/instances.json'
    $.getJSON(requestUrl, (response) => {
      console.log(response)
      const instances = response.filter((instance) => {
        if (instance[0].includes('.onion') || instance[0].includes('.i2p') || instance[0].includes('yewtu.be')) {
          return false
        } else {
          return true
        }
      })

      this.instanceNames = instances.map((instance) => {
        return instance[0]
      })

      this.instanceValues = instances.map((instance) => {
        return instance[1].uri.replace(/\/$/, '')
      })

      this.showInvidiousInstances = true
    }).fail((xhr, textStatus, error) => {
      console.log(xhr)
      console.log(textStatus)
      console.log(requestUrl)
      console.log(error)
    })

    this.updateInvidiousInstanceBounce = debounce(this.updateInvidiousInstance, 500)

    this.currentLocale = localStorage.getItem('locale')
  },
  beforeDestroy: function () {
    if (this.invidiousInstance === '') {
      this.updateInvidiousInstance('https://invidious.snopyta.org')
    }
  },
  methods: {
    handleInvidiousInstanceInput: function (input) {
      const invidiousInstance = input.replace(/\/$/, '')
      this.updateInvidiousInstanceBounce(invidiousInstance)
    },

    handlePreferredApiBackend: function (backend) {
      this.updateBackendPreference(backend)
      console.log(backend)

      if (backend === 'local') {
        this.updateForceLocalBackendForLegacy(false)
      }
    },

    updateLocale: function (locale) {
      if (locale === 'system') {
        const systemLocale = app.getLocale().replace(/-|_/, '_')
        const findLocale = Object.keys(this.$i18n.messages).find((locale) => {
          const localeName = locale.replace(/-|_/, '_')
          return localeName.includes(systemLocale)
        })

        if (typeof findLocale !== 'undefined') {
          this.$i18n.locale = findLocale
          this.currentLocale = 'system'
          localStorage.setItem('locale', 'system')
        } else {
          // Translating this string isn't needed because the user will always see it in English
          this.showToast({
            message: 'Locale not found, defaulting to English (US)'
          })
          this.$i18n.locale = 'en-US'
          this.currentLocale = 'en-US'
          localStorage.setItem('locale', 'en-US')
        }
      } else {
        this.$i18n.locale = locale
        this.currentLocale = locale
        localStorage.setItem('locale', locale)
      }

      const payload = {
        isDev: this.isDev,
        locale: this.currentLocale
      }
      this.getRegionData(payload)
    },

    ...mapActions([
      'showToast',
      'updateEnableSearchSuggestions',
      'updateBackendFallback',
      'updateCheckForUpdates',
      'updateCheckForBlogPosts',
      'updateBarColor',
      'updateBackendPreference',
      'updateLandingPage',
      'updateRegion',
      'updateListType',
      'updateThumbnailPreference',
      'updateInvidiousInstance',
      'updateForceLocalBackendForLegacy',
      'getRegionData'
    ])
  }
})
