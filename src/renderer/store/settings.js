import { defineStore } from 'pinia'
import { DBSettingHandlers } from '../../../datastores/handlers/index'
import { MAIN_PROFILE_ID, IpcChannels, SyncEvents } from '../../../constants'
import i18n from '../../i18n/index'
import { getSystemLocale, showToast } from '../../helpers/utils'
import { useInvidiousStore } from './invidious'
import { useUtilsStore } from './utils'
export const useSettingsStore = defineStore('settings', {
  state: () => {
    return {
      autoplayPlaylists: true,
      autoplayVideos: true,
      backendFallback: true,
      backendPreference: 'local',
      barColor: false,
      checkForBlogPosts: true,
      checkForUpdates: true,
      baseTheme: 'system',
      mainColor: 'Red',
      secColor: 'Blue',
      defaultCaptionSettings: '{}',
      defaultInterval: 5,
      defaultPlayback: 1,
      defaultProfile: MAIN_PROFILE_ID,
      defaultQuality: '720',
      defaultSkipInterval: 5,
      defaultTheatreMode: false,
      defaultVideoFormat: 'dash',
      disableSmoothScrolling: false,
      displayVideoPlayButton: true,
      enableSearchSuggestions: true,
      enableSubtitles: true,
      enterFullscreenOnDisplayRotate: false,
      externalLinkHandling: '',
      externalPlayer: '',
      externalPlayerExecutable: '',
      externalPlayerIgnoreWarnings: false,
      externalPlayerCustomArgs: '',
      expandSideBar: false,
      forceLocalBackendForLegacy: false,
      hideActiveSubscriptions: false,
      hideChannelSubscriptions: false,
      hideCommentLikes: false,
      hideComments: false,
      channelsHidden: '[]',
      hideVideoDescription: false,
      hideLiveChat: false,
      hideLiveStreams: false,
      hideHeaderLogo: false,
      hidePlaylists: false,
      hidePopularVideos: false,
      hideRecommendedVideos: false,
      hideSearchBar: false,
      hideSharingActions: false,
      hideTrendingVideos: false,
      hideUnsubscribeButton: false,
      hideUpcomingPremieres: false,
      hideVideoLikesAndDislikes: false,
      hideVideoViews: false,
      hideWatchedSubs: false,
      hideLabelsSideBar: false,
      hideChapters: false,
      showDistractionFreeTitles: false,
      landingPage: 'subscriptions',
      listType: 'grid',
      maxVideoPlaybackRate: 3,
      playNextVideo: false,
      proxyHostname: '127.0.0.1',
      proxyPort: '9050',
      proxyProtocol: 'socks5',
      proxyVideos: false,
      region: 'US',
      rememberHistory: true,
      removeVideoMetaFiles: true,
      saveWatchedProgress: true,
      showFamilyFriendlyOnly: false,
      sponsorBlockShowSkippedToast: true,
      sponsorBlockUrl: 'https://sponsor.ajay.app',
      sponsorBlockSponsor: {
        color: 'Blue',
        skip: 'autoSkip'
      },
      sponsorBlockSelfPromo: {
        color: 'Yellow',
        skip: 'showInSeekBar'
      },
      sponsorBlockInteraction: {
        color: 'Green',
        skip: 'showInSeekBar'
      },
      sponsorBlockIntro: {
        color: 'Orange',
        skip: 'doNothing'
      },
      sponsorBlockOutro: {
        color: 'Orange',
        skip: 'doNothing'
      },
      sponsorBlockRecap: {
        color: 'Orange',
        skip: 'doNothing'
      },
      sponsorBlockMusicOffTopic: {
        color: 'Orange',
        skip: 'doNothing'
      },
      sponsorBlockFiller: {
        color: 'Orange',
        skip: 'doNothing'
      },
      thumbnailPreference: '',
      useProxy: false,
      useRssFeeds: false,
      useSponsorBlock: false,
      videoVolumeMouseScroll: false,
      videoPlaybackRateMouseScroll: false,
      videoSkipMouseScroll: false,
      videoPlaybackRateInterval: 0.25,
      downloadFolderPath: '',
      downloadBehavior: 'download',
      enableScreenshot: false,
      screenshotFormat: 'png',
      screenshotQuality: 95,
      screenshotAskPath: false,
      screenshotFolderPath: '',
      screenshotFilenamePattern: '%Y%M%D-%H%N%S',
      fetchSubscriptionsAutomatically: true,
      settingsPassword: '',
      allowDashAv1Formats: false,
      defaultInvidiousInstance: '',
      defaultVolume: 1,
      uiScale: 100,
      currentLocale: 'en-US'
    }
  },
  actions: {
    async setCurrentLocale(value) {
      const defaultLocale = 'en-US'
      let targetLocale = value
      if (value === 'system') {
        const systemLocaleName = (await getSystemLocale()).replace('-', '_') // ex: en_US
        const systemLocaleLang = systemLocaleName.split('_')[0] // ex: en
        const targetLocaleOptions = i18n.allLocales.filter((locale) => { // filter out other languages
          const localeLang = locale.replace('-', '_').split('_')[0]
          return localeLang.includes(systemLocaleLang)
        }).sort((a, b) => {
          const aLocaleName = a.replace('-', '_')
          const bLocaleName = b.replace('-', '_')
          const aLocale = aLocaleName.split('_') // ex: [en, US]
          const bLocale = bLocaleName.split('_')
          if (aLocale.includes(systemLocaleName)) { // country & language match, prefer a
            return -1
          } else if (bLocale.includes(systemLocaleName)) { // country & language match, prefer b
            return 1
          } else if (aLocale.length === 1) { // no country code for a, prefer a
            return -1
          } else if (bLocale.length === 1) { // no country code for b, prefer b
            return 1
          } else { // a & b have different country code from system, sort alphabetically
            return aLocaleName.localeCompare(bLocaleName)
          }
        })
        if (targetLocaleOptions.length > 0) {
          targetLocale = targetLocaleOptions[0]
        }

        // Go back to default value if locale is unavailable
        if (!targetLocale) {
          targetLocale = defaultLocale
          // Translating this string isn't necessary
          // because the user will always see it in the default locale
          // (in this case, English (US))
          showToast(`Locale not found, defaulting to ${defaultLocale}`)
        }
      }

      await i18n.loadLocale(targetLocale)

      i18n.locale = targetLocale
      const utilsStore = useUtilsStore()
      await utilsStore.getRegionData({ locale: targetLocale })
    },

    setDefaultInvidiousInstance(value) {
      const invidiousStore = useInvidiousStore()
      this.defaultInvidiousInstance = ''
      if (value !== '' && invidiousStore.currentInvidiousInstance !== value) {
        invidiousStore.setCurrentInvidiousInstance(value)
      }
    },
    setDefaultVolume(value) {
      this.defaultVolume = value
      sessionStorage.setItem('volume', value)
    },

    setUIScale(value) {
      this.uiScale = value
      if (process.env.IS_ELECTRON) {
        const { webFrame } = require('electron')
        webFrame.setZoomFactor(value / 100)
      }
    }
  }
})
