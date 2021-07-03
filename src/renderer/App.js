import Vue from 'vue'
import { mapActions, mapMutations } from 'vuex'
import { ObserveVisibility } from 'vue-observe-visibility'
import FtFlexBox from './components/ft-flex-box/ft-flex-box.vue'
import TopNav from './components/top-nav/top-nav.vue'
import SideNav from './components/side-nav/side-nav.vue'
import FtNotificationBanner from './components/ft-notification-banner/ft-notification-banner.vue'
import FtPrompt from './components/ft-prompt/ft-prompt.vue'
import FtButton from './components/ft-button/ft-button.vue'
import FtToast from './components/ft-toast/ft-toast.vue'
import FtProgressBar from './components/ft-progress-bar/ft-progress-bar.vue'
import $ from 'jquery'
import marked from 'marked'
import Parser from 'rss-parser'

let ipcRenderer = null

Vue.directive('observe-visibility', ObserveVisibility)

export default Vue.extend({
  name: 'App',
  components: {
    FtFlexBox,
    TopNav,
    SideNav,
    FtNotificationBanner,
    FtPrompt,
    FtButton,
    FtToast,
    FtProgressBar
  },
  data: function () {
    return {
      dataReady: false,
      hideOutlines: true,
      showUpdatesBanner: false,
      showBlogBanner: false,
      showReleaseNotes: false,
      updateBannerMessage: '',
      blogBannerMessage: '',
      latestBlogUrl: '',
      updateChangelog: '',
      changeLogTitle: ''
    }
  },
  computed: {
    isDev: function () {
      return process.env.NODE_ENV === 'development'
    },
    isOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },
    usingElectron: function() {
      return this.$store.getters.getUsingElectron
    },
    showProgressBar: function () {
      return this.$store.getters.getShowProgressBar
    },
    isRightAligned: function () {
      return this.$i18n.locale === 'ar'
    },
    checkForUpdates: function () {
      return this.$store.getters.getCheckForUpdates
    },
    checkForBlogPosts: function () {
      return this.$store.getters.getCheckForBlogPosts
    },
    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    defaultProfile: function () {
      return this.$store.getters.getDefaultProfile
    },
    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },
    defaultInvidiousInstance: function () {
      return this.$store.getters.getDefaultInvidiousInstance
    }
  },
  mounted: function () {
    this.grabUserSettings().then(async () => {
      await this.fetchInvidiousInstances()
      if (this.defaultInvidiousInstance === '') {
        await this.setRandomCurrentInvidiousInstance()
      }

      this.grabAllProfiles(this.$t('Profile.All Channels')).then(async () => {
        this.grabHistory()
        this.grabAllPlaylists()
        this.checkThemeSettings()

        if (this.usingElectron) {
          console.log('User is using Electron')
          ipcRenderer = require('electron').ipcRenderer
          this.setupListenerToSyncWindows()
          this.activateKeyboardShortcuts()
          this.openAllLinksExternally()
          this.enableOpenUrl()
          await this.checkExternalPlayer()
        }

        this.dataReady = true

        setTimeout(() => {
          this.checkForNewUpdates()
          this.checkForNewBlogPosts()
        }, 500)
      })
    })
  },
  methods: {
    checkThemeSettings: function () {
      let baseTheme = localStorage.getItem('baseTheme')
      let mainColor = localStorage.getItem('mainColor')
      let secColor = localStorage.getItem('secColor')

      if (baseTheme === null) {
        baseTheme = 'light'
      }

      if (mainColor === null) {
        mainColor = 'mainRed'
      }

      if (secColor === null) {
        secColor = 'secBlue'
      }

      const theme = {
        baseTheme: baseTheme,
        mainColor: mainColor,
        secColor: secColor
      }

      this.updateTheme(theme)
    },

    updateTheme: function (theme) {
      console.log(theme)
      const className = `${theme.baseTheme} ${theme.mainColor} ${theme.secColor}`
      const body = document.getElementsByTagName('body')[0]
      body.className = className
      localStorage.setItem('baseTheme', theme.baseTheme)
      localStorage.setItem('mainColor', theme.mainColor)
      localStorage.setItem('secColor', theme.secColor)
    },

    checkForNewUpdates: function () {
      if (this.checkForUpdates) {
        const { version } = require('../../package.json')
        const requestUrl = 'https://api.github.com/repos/freetubeapp/freetube/releases'

        $.getJSON(requestUrl, (response) => {
          const tagName = response[0].tag_name
          const versionNumber = tagName.replace('v', '').replace('-beta', '')
          this.updateChangelog = marked(response[0].body)
          this.changeLogTitle = response[0].name

          const message = this.$t('Version $ is now available!  Click for more details')
          this.updateBannerMessage = message.replace('$', versionNumber)

          const appVersion = version.split('.')
          const latestVersion = versionNumber.split('.')

          if (parseInt(appVersion[0]) < parseInt(latestVersion[0])) {
            this.showUpdatesBanner = true
          } else if (parseInt(appVersion[1]) < parseInt(latestVersion[1])) {
            this.showUpdatesBanner = true
          } else if (parseInt(appVersion[2]) < parseInt(latestVersion[2])) {
            this.showUpdatesBanner = true
          }
        }).fail((xhr, textStatus, error) => {
          console.log(xhr)
          console.log(textStatus)
          console.log(requestUrl)
          console.log(error)
        })
      }
    },

    checkForNewBlogPosts: function () {
      if (this.checkForBlogPosts) {
        const parser = new Parser()
        const feedUrl = 'https://write.as/freetube/feed/'
        let lastAppWasRunning = localStorage.getItem('lastAppWasRunning')

        if (lastAppWasRunning !== null) {
          lastAppWasRunning = new Date(lastAppWasRunning)
        }

        parser.parseURL(feedUrl).then((response) => {
          const latestBlog = response.items[0]
          const latestPubDate = new Date(latestBlog.pubDate)

          if (lastAppWasRunning === null || latestPubDate > lastAppWasRunning) {
            const message = this.$t('A new blog is now available, $. Click to view more')
            this.blogBannerMessage = message.replace('$', latestBlog.title)
            this.latestBlogUrl = latestBlog.link
            this.showBlogBanner = true
          }

          localStorage.setItem('lastAppWasRunning', new Date())
        })
      }
    },

    checkExternalPlayer: async function () {
      const payload = {
        isDev: this.isDev,
        externalPlayer: this.externalPlayer
      }
      this.getExternalPlayerCmdArgumentsData(payload)
    },

    handleUpdateBannerClick: function (response) {
      if (response !== false) {
        this.showReleaseNotes = true
      } else {
        this.showUpdatesBanner = false
      }
    },

    handleNewBlogBannerClick: function (response) {
      if (response) {
        this.openExternalLink(this.latestBlogUrl)
      }

      this.showBlogBanner = false
    },

    openDownloadsPage: function () {
      const url = 'https://freetubeapp.io#download'
      this.openExternalLink(url)
      this.showReleaseNotes = false
      this.showUpdatesBanner = false
    },

    activateKeyboardShortcuts: function () {
      $(document).on('keydown', this.handleKeyboardShortcuts)
      $(document).on('mousedown', () => {
        this.hideOutlines = true
      })
    },

    handleKeyboardShortcuts: function (event) {
      if (event.altKey) {
        switch (event.code) {
          case 'ArrowRight':
            window.history.forward()
            break
          case 'ArrowLeft':
            window.history.back()
            break
        }
      }
      switch (event.code) {
        case 'Tab':
          this.hideOutlines = false
          break
      }
    },

    openAllLinksExternally: function () {
      $(document).on('click', 'a[href^="http"]', (event) => {
        const el = event.currentTarget
        console.log(this.usingElectron)
        console.log(el)
        event.preventDefault()

        // Check if it's a YouTube link
        const youtubeUrlPattern = /^https?:\/\/((www\.)?youtube\.com(\/embed)?|youtu\.be)\/.*$/
        const isYoutubeLink = youtubeUrlPattern.test(el.href)

        if (isYoutubeLink) {
          this.handleYoutubeLink(el.href)
        } else {
          // Open links externally by default
          this.openExternalLink(el.href)
        }
      })
    },

    handleYoutubeLink: function (href) {
      this.getYoutubeUrlInfo(href).then((result) => {
        switch (result.urlType) {
          case 'video': {
            const { videoId, timestamp, playlistId } = result

            const query = {}
            if (timestamp) {
              query.timestamp = timestamp
            }
            if (playlistId && playlistId.length > 0) {
              query.playlistId = playlistId
            }
            this.$router.push({
              path: `/watch/${videoId}`,
              query: query
            })
            break
          }

          case 'playlist': {
            const { playlistId, query } = result

            this.$router.push({
              path: `/playlist/${playlistId}`,
              query
            })
            break
          }

          case 'search': {
            const { searchQuery, query } = result

            this.$router.push({
              path: `/search/${encodeURIComponent(searchQuery)}`,
              query
            })
            break
          }

          case 'hashtag': {
            // TODO: Implement a hashtag related view
            let message = 'Hashtags have not yet been implemented, try again later'
            if (this.$te(message) && this.$t(message) !== '') {
              message = this.$t(message)
            }

            this.showToast({
              message: message
            })
            break
          }

          case 'channel': {
            const { channelId } = result

            this.$router.push({
              path: `/channel/${channelId}`
            })
            break
          }

          case 'invalid_url': {
            // Do nothing
            break
          }

          default: {
            // Unknown URL type
            let message = 'Unknown YouTube url type, cannot be opened in app'
            if (this.$te(message) && this.$t(message) !== '') {
              message = this.$t(message)
            }

            this.showToast({
              message: message
            })
          }
        }
      })
    },

    enableOpenUrl: function () {
      ipcRenderer.on('openUrl', (event, url) => {
        if (url) {
          this.handleYoutubeLink(url)
        }
      })

      ipcRenderer.send('appReady')
    },

    ...mapMutations([
      'setInvidiousInstancesList'
    ]),

    ...mapActions([
      'showToast',
      'openExternalLink',
      'grabUserSettings',
      'grabAllProfiles',
      'grabHistory',
      'grabAllPlaylists',
      'getYoutubeUrlInfo',
      'getExternalPlayerCmdArgumentsData',
      'fetchInvidiousInstances',
      'setRandomCurrentInvidiousInstance',
      'setupListenerToSyncWindows'
    ])
  }
})

/* Design Tweaks Theme */ window.onload = function(){document.querySelector('.logoIcon').outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 2695 490" width="150"><style>tspan { white-space:pre }.shp0 { fill: #ffffff } .shp1 { fill: var(--accent-color) } </style><path fill-rule="evenodd" class="shp0" d="M445.75 475.5C431.08 475.5 419.75 471.5 411.75 463.5C403.75 455.5 399.75 444 399.75 429L399.75 165C399.75 150 403.75 138.5 411.75 130.5C419.75 122.5 431.25 118.5 446.25 118.5L569.25 118.5C609.25 118.5 640.08 128.33 661.75 148C683.75 167.33 694.75 194.33 694.75 229C694.75 255.33 688.08 277.5 674.75 295.5C661.75 313.17 642.75 325.5 617.75 332.5C636.41 337.5 651.41 350.33 662.75 371L687.75 416C693.08 426 695.41 435.5 694.75 444.5C694.41 453.5 690.91 461 684.25 467C677.58 472.67 667.75 475.5 654.75 475.5C641.75 475.5 631.08 473 622.75 468C614.75 462.67 607.58 454.17 601.25 442.5L555.75 359C551.75 351.67 546.58 346.67 540.25 344C534.25 341 527.25 339.5 519.25 339.5L491.75 339.5L491.75 429C491.75 444 487.75 455.5 479.75 463.5C472.08 471.5 460.75 475.5 445.75 475.5ZM491.75 189L491.75 274.5L552.75 274.5C589.08 274.5 607.25 260.17 607.25 231.5C607.25 203.17 589.08 189 552.75 189L491.75 189ZM970.25 471L800.75 471C768.75 471 752.75 455.17 752.75 423.5L752.75 166C752.75 134.33 768.75 118.5 800.75 118.5L970.25 118.5C994.25 118.5 1006.25 130.17 1006.25 153.5C1006.25 177.5 994.25 189.5 970.25 189.5L840.75 189.5L840.75 256.5L959.25 256.5C983.25 256.5 995.25 268.33 995.25 292C995.25 315.67 983.25 327.5 959.25 327.5L840.75 327.5L840.75 400L970.25 400C994.25 400 1006.25 411.83 1006.25 435.5C1006.25 459.17 994.25 471 970.25 471ZM1277.25 471L1107.75 471C1075.75 471 1059.75 455.17 1059.75 423.5L1059.75 166C1059.75 134.33 1075.75 118.5 1107.75 118.5L1277.25 118.5C1301.25 118.5 1313.25 130.17 1313.25 153.5C1313.25 177.5 1301.25 189.5 1277.25 189.5L1147.75 189.5L1147.75 256.5L1266.25 256.5C1290.25 256.5 1302.25 268.33 1302.25 292C1302.25 315.67 1290.25 327.5 1266.25 327.5L1147.75 327.5L1147.75 400L1277.25 400C1301.25 400 1313.25 411.83 1313.25 435.5C1313.25 459.17 1301.25 471 1277.25 471Z"/><path fill-rule="evenodd" class="shp1" d="M1498.25 475.5C1483.58 475.5 1472.25 471.5 1464.25 463.5C1456.25 455.5 1452.25 444 1452.25 429L1452.25 193.5L1373.75 193.5C1348.41 193.5 1335.75 181 1335.75 156C1335.75 131 1348.41 118.5 1373.75 118.5L1622.75 118.5C1648.08 118.5 1660.75 131 1660.75 156C1660.75 181 1648.08 193.5 1622.75 193.5L1544.25 193.5L1544.25 429C1544.25 444 1540.25 455.5 1532.25 463.5C1524.58 471.5 1513.25 475.5 1498.25 475.5ZM1847.25 476.5C1795.91 476.5 1756.58 463.5 1729.25 437.5C1702.25 411.5 1688.75 372.67 1688.75 321L1688.75 160.5C1688.75 145.5 1692.75 134 1700.75 126C1708.75 118 1720.08 114 1734.75 114C1749.41 114 1760.75 118 1768.75 126C1776.75 134 1780.75 145.5 1780.75 160.5L1780.75 322C1780.75 347.67 1786.41 367 1797.75 380C1809.08 393 1825.58 399.5 1847.25 399.5C1868.58 399.5 1884.91 393 1896.25 380C1907.58 367 1913.25 347.67 1913.25 322L1913.25 160.5C1913.25 145.5 1917.08 134 1924.75 126C1932.75 118 1944.08 114 1958.75 114C1973.41 114 1984.58 118 1992.25 126C1999.91 134 2003.75 145.5 2003.75 160.5L2003.75 321C2003.75 372.67 1990.41 411.5 1963.75 437.5C1937.41 463.5 1898.58 476.5 1847.25 476.5ZM2240.25 471L2113.25 471C2081.25 471 2065.25 455.17 2065.25 423.5L2065.25 166C2065.25 134.33 2081.25 118.5 2113.25 118.5L2235.25 118.5C2273.25 118.5 2302.58 126.83 2323.25 143.5C2344.25 159.83 2354.75 181.83 2354.75 209.5C2354.75 227.83 2350.08 243.83 2340.75 257.5C2331.75 271.17 2319.08 281.33 2302.75 288C2322.41 294 2337.58 304.17 2348.25 318.5C2358.91 332.5 2364.25 350 2364.25 371C2364.25 402 2353.08 426.5 2330.75 444.5C2308.75 462.17 2278.58 471 2240.25 471ZM2153.25 186L2153.25 258.5L2218.75 258.5C2235.41 258.5 2247.58 255.5 2255.25 249.5C2263.25 243.5 2267.25 234.33 2267.25 222C2267.25 209.67 2263.25 200.67 2255.25 195C2247.58 189 2235.41 186 2218.75 186L2153.25 186ZM2153.25 326L2153.25 403.5L2227.75 403.5C2244.75 403.5 2257.08 400.33 2264.75 394C2272.75 387.33 2276.75 377.5 2276.75 364.5C2276.75 351.5 2272.75 341.83 2264.75 335.5C2257.08 329.17 2244.75 326 2227.75 326L2153.25 326ZM2633.75 471L2464.25 471C2432.25 471 2416.25 455.17 2416.25 423.5L2416.25 166C2416.25 134.33 2432.25 118.5 2464.25 118.5L2633.75 118.5C2657.75 118.5 2669.75 130.17 2669.75 153.5C2669.75 177.5 2657.75 189.5 2633.75 189.5L2504.25 189.5L2504.25 256.5L2622.75 256.5C2646.75 256.5 2658.75 268.33 2658.75 292C2658.75 315.67 2646.75 327.5 2622.75 327.5L2504.25 327.5L2504.25 400L2633.75 400C2657.75 400 2669.75 411.83 2669.75 435.5C2669.75 459.17 2657.75 471 2633.75 471Z"/><path class="shp0" d="M83 13.63C81.63 13.85 78.47 14.3 76 14.64C72.86 15.06 70.67 16.12 68.75 18.12C66.82 20.14 66 22.05 66 24.5C66 26.43 66.65 29.24 67.44 30.75C68.22 32.26 91.06 55.64 118.19 82.7C145.31 109.77 168.74 132.38 170.25 132.95C172.07 133.65 196.96 134 243.75 134.01C303.93 134.02 315.77 133.79 323 132.45C328.18 131.49 334.62 129.37 339.5 127.01C344.04 124.82 349.37 121.28 351.84 118.83C354.22 116.45 357.66 112.02 359.48 109C361.3 105.98 363.48 101.48 364.32 99C365.16 96.52 366.32 91.57 366.91 88C367.5 84.43 367.99 77.56 367.99 72.75C368 67.94 367.33 60.51 366.51 56.25C365.7 51.99 363.48 45.35 361.6 41.5C359.56 37.35 356 32.33 352.83 29.16C349.53 25.85 344.83 22.55 340.5 20.48C336.65 18.65 330.13 16.35 326 15.38C319.09 13.76 309.38 13.6 202 13.42C137.92 13.32 84.38 13.41 83 13.63ZM30.06 63.74C28.72 64.71 27.03 66.96 26.31 68.75C25.25 71.39 25 105.22 24.99 248.25C24.98 404.46 25.15 425.47 26.55 433C27.51 438.18 29.63 444.62 31.99 449.5C34.18 454.04 37.72 459.37 40.17 461.84C42.55 464.22 46.97 467.66 50 469.48C53.03 471.3 57.53 473.48 60 474.32C62.47 475.16 67.43 476.32 71 476.91C74.57 477.5 81.44 477.99 86.25 477.99C91.06 478 98.49 477.33 102.75 476.51C107.01 475.7 113.65 473.48 117.5 471.6C121.65 469.56 126.67 466 129.84 462.83C133.15 459.53 136.45 454.83 138.52 450.5C140.35 446.65 142.56 440.01 143.43 435.75C144.81 428.93 145 412.21 144.99 296.75L144.97 165.5C69.43 89.77 45.7 66.47 43.5 64.86C40.86 62.93 38.31 61.95 36 61.96C34.07 61.98 31.4 62.78 30.06 63.74Z"/><path class="shp1" d="M334.95 302.31L230.06 361.56C205.99 375.16 186.74 363.8 187 336.15L188.14 215.69C188.4 188.04 207.86 177.05 231.67 191.1L335.42 252.31C359.24 266.37 359.03 288.71 334.95 302.31Z"/></svg>'; };
