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
import { showToast } from '../../helpers/utils'

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
        'end',
        'hidden'
      ],
      externalLinkHandlingValues: [
        '',
        'openLinkAfterPrompt',
        'doNothing'
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
        this.$t('Settings.General Settings.Thumbnail Preference.End'),
        this.$t('Settings.General Settings.Thumbnail Preference.Hidden')
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
  mounted: function () {
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
      const randomIndex = Math.floor(Math.random() * instanceList.length)
      this.setCurrentInvidiousInstance(instanceList[randomIndex])
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

    ...mapMutations([
      'setCurrentInvidiousInstance'
    ]),

    ...mapActions([
      'updateEnableSearchSuggestions',
      'updateBackendFallback',
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
      'updateExternalLinkHandling'
    ])
  }
})
