import Vue from 'vue'
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
import { markdown } from 'markdown'
import Parser from 'rss-parser'

let useElectron
let shell
let electron

Vue.directive('observe-visibility', ObserveVisibility)

if (window && window.process && window.process.type === 'renderer') {
  /* eslint-disable-next-line */
  electron = require('electron')
  shell = electron.shell
  useElectron = true
} else {
  useElectron = false
}

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
    }
  },
  mounted: function () {
    this.$store.dispatch('grabUserSettings')
    this.$store.dispatch('grabHistory')
    this.$store.dispatch('grabAllProfiles', this.$t('Profile.All Channels'))
    this.$store.commit('setUsingElectron', useElectron)
    this.checkThemeSettings()
    this.checkLocale()

    if (useElectron) {
      console.log('User is using Electron')
      this.activateKeyboardShortcuts()
      this.openAllLinksExternally()
      this.enableOpenUrl()
      this.setBoundsOnClose()
    }

    setTimeout(() => {
      this.checkForNewUpdates()
      this.checkForNewBlogPosts()
    }, 500)
  },
  methods: {
    checkLocale: function () {
      const locale = localStorage.getItem('locale')

      if (locale === null) {
        // TODO: Get User default locale
        this.$i18n.locale = 'en-US'
      } else {
        this.$i18n.locale = locale
      }
      const payload = {
        isDev: this.isDev,
        locale: this.$i18n.locale
      }

      this.$store.dispatch('getRegionData', payload)
    },

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
          this.updateChangelog = markdown.toHTML(response[0].body)
          this.changeLogTitle = response[0].name

          const message = this.$t('Version $ is now available!  Click for more details')
          this.updateBannerMessage = message.replace('$', versionNumber)
          if (version < versionNumber) {
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

    handleUpdateBannerClick: function (response) {
      if (response !== false) {
        this.showReleaseNotes = true
      } else {
        this.showUpdatesBanner = false
      }
    },

    handleNewBlogBannerClick: function (response) {
      if (response) {
        shell.openExternal(this.latestBlogUrl)
      }

      this.showBlogBanner = false
    },

    openDownloadsPage: function () {
      const url = 'https://freetubeapp.io#download'
      shell.openExternal(url)
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
      // Open links externally by default
      $(document).on('click', 'a[href^="http"]', (event) => {
        const el = event.currentTarget
        console.log(useElectron)
        console.log(el)
        if (typeof (shell) !== 'undefined') {
          event.preventDefault()
          shell.openExternal(el.href)
        }
      })
    },

    enableOpenUrl: function () {
      const v = this
      electron.ipcRenderer.on('openUrl', function (event, url) {
        if (url) {
          v.$store.dispatch('getVideoIdFromUrl', url).then((result) => {
            if (result) {
              v.$router.push({
                path: `/watch/${result}`
              })
            } else {
              v.$router.push({
                path: `/search/${encodeURIComponent(url)}`,
                query: {
                  sortBy: v.searchSettings.sortBy,
                  time: v.searchSettings.time,
                  type: v.searchSettings.type,
                  duration: v.searchSettings.duration
                }
              })
            }
          })
        }
      })

      electron.ipcRenderer.send('appReady')
    },

    setBoundsOnClose: function () {
      window.onbeforeunload = (e) => {
        electron.ipcRenderer.send('setBounds')
      }
    }
  }
})
