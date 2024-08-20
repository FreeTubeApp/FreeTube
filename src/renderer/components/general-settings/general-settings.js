import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../ft-button/ft-button.vue'

import debounce from 'lodash.debounce'
import allLocales from '../../../../static/locales/activeLocales.json'
import { randomArrayItem, showToast } from '../../helpers/utils'
import { translateWindowTitle } from '../../helpers/strings'

export default defineComponent({
  name: 'GeneralSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton
  },
  data: function () {
    return {
      backendValues: process.env.SUPPORTS_LOCAL_API
        ? [
            'invidious',
            'local'
          ]
        : [
            'invidious'
          ],
      viewTypeValues: [
        'grid',
        'list'
      ],
      thumbnailTypeValues: [
        '',
        'start',
        'middle',
        'end',
        'hidden',
        'blur'
      ],
      externalLinkHandlingValues: [
        '',
        'openLinkAfterPrompt',
        'doNothing'
      ],
      includedDefaultPageNames: [
        'subscriptions',
        'subscribedChannels',
        'trending',
        'popular',
        'userPlaylists',
        'history',
        'settings'
      ]
    }
  },
  computed: {
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    enableSearchSuggestions: function () {
      return this.$store.getters.getEnableSearchSuggestions
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    blurThumbnails: function () {
      return this.$store.getters.getBlurThumbnails
    },
    checkForUpdates: function () {
      return this.$store.getters.getCheckForUpdates
    },
    checkForBlogPosts: function () {
      return this.$store.getters.getCheckForBlogPosts
    },
    hidePlaylists: function () {
      return this.$store.getters.getHidePlaylists
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    defaultPages: function () {
      let includedPageNames = this.includedDefaultPageNames
      if (this.hideTrendingVideos) includedPageNames = includedPageNames.filter((pageName) => pageName !== 'trending')
      if (this.hidePlaylists) includedPageNames = includedPageNames.filter((pageName) => pageName !== 'userPlaylists')
      if (!(!this.hidePopularVideos && (this.backendFallback || this.backendPreference === 'invidious'))) includedPageNames = includedPageNames.filter((pageName) => pageName !== 'popular')
      return this.$router.getRoutes().filter((route) => includedPageNames.includes(route.name))
    },
    defaultPageNames: function () {
      return this.defaultPages.map((route) => translateWindowTitle(route.meta.title, this.$i18n))
    },
    defaultPageValues: function () {
      // avoid Vue parsing issues by excluding '/' from path values
      return this.defaultPages.map((route) => route.path.substring(1))
    },
    backendPreference: function () {
      if (!process.env.SUPPORTS_LOCAL_API && this.$store.getters.getBackendPreference === 'local') {
        this.handlePreferredApiBackend('invidious')
      }

      return this.$store.getters.getBackendPreference
    },
    landingPage: function () {
      const landingPage = this.$store.getters.getLandingPage
      // invalidate landing page selection & restore to default value if no longer valid
      if (!this.defaultPageValues.includes(landingPage)) {
        this.updateLandingPage('subscriptions')
      }
      return this.$store.getters.getLandingPage
    },
    region: function () {
      return this.$store.getters.getRegion
    },
    listType: function () {
      return this.$store.getters.getListType
    },
    thumbnailPreference: function () {
      return this.blurThumbnails ? 'blur' : this.$store.getters.getThumbnailPreference
    },
    currentLocale: function () {
      return this.$store.getters.getCurrentLocale
    },
    regionNames: function () {
      return this.$store.getters.getRegionNames
    },
    regionValues: function () {
      return this.$store.getters.getRegionValues
    },
    invidiousInstancesList: function () {
      return this.$store.getters.getInvidiousInstancesList
    },
    defaultInvidiousInstance: function () {
      return this.$store.getters.getDefaultInvidiousInstance
    },
    generalAutoLoadMorePaginatedItemsEnabled() {
      return this.$store.getters.getGeneralAutoLoadMorePaginatedItemsEnabled
    },

    localeOptions: function () {
      return [
        'system',
        ...allLocales
      ]
    },

    localeNames: function () {
      return [
        this.$t('Settings.General Settings.System Default'),
        ...process.env.LOCALE_NAMES
      ]
    },

    backendNames: function () {
      if (process.env.SUPPORTS_LOCAL_API) {
        return [
          this.$t('Settings.General Settings.Preferred API Backend.Invidious API'),
          this.$t('Settings.General Settings.Preferred API Backend.Local API')
        ]
      } else {
        return [
          this.$t('Settings.General Settings.Preferred API Backend.Invidious API')
        ]
      }
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
        this.$t('Settings.General Settings.Thumbnail Preference.End'),
        this.$t('Settings.General Settings.Thumbnail Preference.Hidden'),
        this.$t('Settings.General Settings.Thumbnail Preference.Blur')
      ]
    },

    externalLinkHandling: function () {
      return this.$store.getters.getExternalLinkHandling
    },

    externalLinkHandlingNames: function () {
      return [
        this.$t('Settings.General Settings.External Link Handling.Open Link'),
        this.$t('Settings.General Settings.External Link Handling.Ask Before Opening Link'),
        this.$t('Settings.General Settings.External Link Handling.No Action')
      ]
    }
  },
  created: function () {
    this.setCurrentInvidiousInstanceBounce =
      debounce(this.setCurrentInvidiousInstance, 500)
  },
  beforeDestroy: function () {
    if (this.currentInvidiousInstance === '') {
      // FIXME: If we call an action from here, there's no guarantee it will finish
      // before the component is destroyed, which could bring up some problems
      // Since I can't see any way to await it (because lifecycle hooks must be
      // synchronous), unfortunately, we have to copy/paste the logic
      // from the `setRandomCurrentInvidiousInstance` action onto here
      const instanceList = this.invidiousInstancesList
      this.setCurrentInvidiousInstance(randomArrayItem(instanceList))
    }
  },
  methods: {
    handleInvidiousInstanceInput: function (input) {
      let instance = input
      // If NOT something like https:// (1-2 slashes), remove trailing slash
      if (!/^(https?):(\/){1,2}$/.test(input)) {
        instance = input.replace(/\/$/, '')
      }
      this.setCurrentInvidiousInstanceBounce(instance)
    },

    handleSetDefaultInstanceClick: function () {
      const instance = this.currentInvidiousInstance
      this.updateDefaultInvidiousInstance(instance)

      const message = this.$t('Default Invidious instance has been set to {instance}', { instance })
      showToast(message)
    },

    handleClearDefaultInstanceClick: function () {
      this.updateDefaultInvidiousInstance('')
      showToast(this.$t('Default Invidious instance has been cleared'))
    },

    handlePreferredApiBackend: function (backend) {
      this.updateBackendPreference(backend)

      if (backend === 'local') {
        this.updateForceLocalBackendForLegacy(false)
      }
    },

    handleThumbnailPreferenceChange: function (value) {
      this.updateBlurThumbnails(value === 'blur')
      this.updateThumbnailPreference(value)
    },

    ...mapMutations([
      'setCurrentInvidiousInstance'
    ]),

    ...mapActions([
      'updateEnableSearchSuggestions',
      'updateBackendFallback',
      'updateBlurThumbnails',
      'updateCheckForUpdates',
      'updateCheckForBlogPosts',
      'updateBarColor',
      'updateBackendPreference',
      'updateDefaultInvidiousInstance',
      'updateLandingPage',
      'updateRegion',
      'updateListType',
      'updateThumbnailPreference',
      'updateForceLocalBackendForLegacy',
      'updateCurrentLocale',
      'updateExternalLinkHandling',
      'updateGeneralAutoLoadMorePaginatedItemsEnabled',
    ])
  }
})
