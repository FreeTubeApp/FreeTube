import { defineStore } from 'pinia'
import { DBSettingHandlers } from '../../../datastores/handlers/index'
import { MAIN_PROFILE_ID, IpcChannels, SyncEvents } from '../../../constants'
import i18n from '../../i18n/index'
import { getSystemLocale, showToast } from '../../helpers/utils'

export const settingsStore = defineStore('settings', {
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
    }
  }
})
