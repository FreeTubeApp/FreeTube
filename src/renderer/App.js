import Vue from 'vue'
import { mapActions } from 'vuex'
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
import { app } from '@electron/remote'
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
    const v = this
    this.$store.dispatch('grabUserSettings').then(() => {
      this.$store.dispatch('grabAllProfiles', this.$t('Profile.All Channels')).then(() => {
        this.$store.dispatch('grabHistory')
        this.$store.dispatch('grabAllPlaylists')
        this.$store.commit('setUsingElectron', useElectron)
        this.checkThemeSettings()
        this.checkLocale()

        v.dataReady = true

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
      })
    })
  },
  methods: {
    checkLocale: function () {
      const locale = localStorage.getItem('locale')

      if (locale === null || locale === 'system') {
        const systemLocale = app.getLocale().replace(/-|_/, '_')
        const findLocale = Object.keys(this.$i18n.messages).find((locale) => {
          const localeName = locale.replace(/-|_/, '_')
          return localeName.includes(systemLocale)
        })

        if (typeof findLocale !== 'undefined') {
          this.$i18n.locale = findLocale
          localStorage.setItem('locale', 'system')
        } else {
          this.$i18n.locale = 'en-US'
          localStorage.setItem('locale', 'en-US')
        }
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
      $(document).on('click', 'a[href^="http"]', (event) => {
        const el = event.currentTarget
        console.log(useElectron)
        console.log(el)
        event.preventDefault()

        // Check if it's a YouTube link
        const youtubeUrlPattern = /^https?:\/\/((www\.)?youtube\.com(\/embed)?|youtu\.be)\/.*$/
        const isYoutubeLink = youtubeUrlPattern.test(el.href)

        if (isYoutubeLink) {
          this.handleYoutubeLink(el.href)
        } else {
          // Open links externally by default
          if (typeof (shell) !== 'undefined') {
            shell.openExternal(el.href)
          }
        }
      })
    },

    handleYoutubeLink: function (href) {
      this.$store.dispatch('getYoutubeUrlInfo', href).then((result) => {
        switch (result.urlType) {
          case 'video': {
            const { videoId, timestamp } = result

            this.$router.push({
              path: `/watch/${videoId}`,
              query: timestamp ? { timestamp } : {}
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
      const v = this
      electron.ipcRenderer.on('openUrl', function (event, url) {
        if (url) {
          v.handleYoutubeLink(url)
        }
      })

      electron.ipcRenderer.send('appReady')
    },

    setBoundsOnClose: function () {
      window.onbeforeunload = (e) => {
        electron.ipcRenderer.send('setBounds')
      }
    },

    ...mapActions([
      'showToast'
    ])
  }
})
