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
import { marked } from 'marked'
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
      changeLogTitle: '',
      lastExternalLinkToBeOpened: '',
      showExternalLinkOpeningPrompt: false,
      externalLinkOpeningPromptValues: [
        'yes',
        'no'
      ]
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
    windowTitle: function () {
      if (this.$route.meta.title !== 'Channel' && this.$route.meta.title !== 'Watch') {
        let title =
        this.$route.meta.path === '/home'
          ? process.env.PRODUCT_NAME
          : `${this.$t(this.$route.meta.title)} - ${process.env.PRODUCT_NAME}`
        if (!title) {
          title = process.env.PRODUCT_NAME
        }
        return title
      } else {
        return null
      }
    },
    defaultProfile: function () {
      return this.$store.getters.getDefaultProfile
    },
    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },
    defaultInvidiousInstance: function () {
      return this.$store.getters.getDefaultInvidiousInstance
    },

    externalLinkOpeningPromptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    },

    externalLinkHandling: function () {
      return this.$store.getters.getExternalLinkHandling
    }
  },
  watch: {
    windowTitle: 'setWindowTitle',
    $route () {
      // react to route changes...
      // Hide top nav filter panel on page change
      this.$refs.topNav.hideFilters()
    }
  },
  created () {
    this.checkThemeSettings()
    this.setWindowTitle()
  },
  mounted: function () {
    this.grabUserSettings().then(async () => {
      await this.fetchInvidiousInstances({ isDev: this.isDev })
      if (this.defaultInvidiousInstance === '') {
        await this.setRandomCurrentInvidiousInstance()
      }

      this.grabAllProfiles(this.$t('Profile.All Channels')).then(async () => {
        this.grabHistory()
        this.grabAllPlaylists()

        if (this.usingElectron) {
          console.log('User is using Electron')
          ipcRenderer = require('electron').ipcRenderer
          this.setupListenersToSyncWindows()
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

      this.$router.afterEach((to, from) => {
        this.$refs.topNav.navigateHistory()
      })
    })
  },
  methods: {
    checkThemeSettings: function () {
      let baseTheme = localStorage.getItem('baseTheme')
      let mainColor = localStorage.getItem('mainColor')
      let secColor = localStorage.getItem('secColor')

      if (baseTheme === null) {
        baseTheme = 'dark'
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
          this.updateChangelog = marked.parse(response[0].body)
          this.changeLogTitle = response[0].name

          const message = this.$t('Version $ is now available!  Click for more details')
          this.updateBannerMessage = message.replace('$', versionNumber)

          const appVersion = version.split('.')
          const latestVersion = versionNumber.split('.')

          if (parseInt(appVersion[0]) < parseInt(latestVersion[0])) {
            this.showUpdatesBanner = true
          } else if (parseInt(appVersion[1]) < parseInt(latestVersion[1])) {
            this.showUpdatesBanner = true
          } else if (parseInt(appVersion[2]) < parseInt(latestVersion[2]) && parseInt(appVersion[1]) <= parseInt(latestVersion[1])) {
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
            this.$refs.topNav.historyForward()
            break
          case 'ArrowLeft':
            this.$refs.topNav.historyBack()
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
        this.handleLinkClick(event)
      })

      $(document).on('auxclick', 'a[href^="http"]', (event) => {
        this.handleLinkClick(event)
      })
    },

    handleLinkClick: function (event) {
      const el = event.currentTarget
      console.log(this.usingElectron)
      console.log(el)
      event.preventDefault()

      // Check if it's a YouTube link
      const youtubeUrlPattern = /^https?:\/\/((www\.)?youtube\.com(\/embed)?|youtu\.be)\/.*$/
      const isYoutubeLink = youtubeUrlPattern.test(el.href)

      if (isYoutubeLink) {
        this.handleYoutubeLink(el.href)
      } else if (this.externalLinkHandling === 'doNothing') {
        // Let user know opening external link is disabled via setting
        this.showToast({
          message: this.$t('External link opening has been disabled in the general settings')
        })
      } else if (this.externalLinkHandling === 'openLinkAfterPrompt') {
        // Storing the URL is necessary as
        // there is no other way to pass the URL to click callback
        this.lastExternalLinkToBeOpened = el.href
        this.showExternalLinkOpeningPrompt = true
      } else {
        // Open links externally
        this.openExternalLink(el.href)
      }
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
            const { channelId, subPath } = result

            this.$router.push({
              path: `/channel/${channelId}/${subPath}`
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

    handleExternalLinkOpeningPromptAnswer: function (option) {
      this.showExternalLinkOpeningPrompt = false

      if (option === 'yes' && this.lastExternalLinkToBeOpened.length > 0) {
        // Maybe user should be notified
        // if `lastExternalLinkToBeOpened` is empty

        // Open links externally
        this.openExternalLink(this.lastExternalLinkToBeOpened)
      }
    },

    setWindowTitle: function() {
      if (this.windowTitle !== null) {
        document.title = this.windowTitle
      }
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
      'setupListenersToSyncWindows'
    ])
  }
})
