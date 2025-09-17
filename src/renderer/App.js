import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtFlexBox from './components/ft-flex-box/ft-flex-box.vue'
import TopNav from './components/TopNav/TopNav.vue'
import SideNav from './components/SideNav/SideNav.vue'
import FtNotificationBanner from './components/FtNotificationBanner/FtNotificationBanner.vue'
import FtPrompt from './components/FtPrompt/FtPrompt.vue'
import FtButton from './components/FtButton/FtButton.vue'
import FtToast from './components/FtToast/FtToast.vue'
import FtProgressBar from './components/FtProgressBar/FtProgressBar.vue'
import FtPlaylistAddVideoPrompt from './components/FtPlaylistAddVideoPrompt/FtPlaylistAddVideoPrompt.vue'
import FtCreatePlaylistPrompt from './components/FtCreatePlaylistPrompt/FtCreatePlaylistPrompt.vue'
import FtKeyboardShortcutPrompt from './components/FtKeyboardShortcutPrompt/FtKeyboardShortcutPrompt.vue'
import FtSearchFilters from './components/FtSearchFilters/FtSearchFilters.vue'
import { marked } from 'marked'
import packageDetails from '../../package.json'
import { openExternalLink, openInternalPath, showToast } from './helpers/utils'
import { translateWindowTitle } from './helpers/strings'

export default defineComponent({
  name: 'App',
  components: {
    FtFlexBox,
    TopNav,
    SideNav,
    FtNotificationBanner,
    FtPrompt,
    FtButton,
    FtToast,
    FtProgressBar,
    FtPlaylistAddVideoPrompt,
    FtCreatePlaylistPrompt,
    FtSearchFilters,
    FtKeyboardShortcutPrompt,
  },
  data: function () {
    return {
      dataReady: false,
      showUpdatesBanner: false,
      showBlogBanner: false,
      showReleaseNotes: false,
      updateBannerMessage: '',
      blogBannerMessage: '',
      latestBlogUrl: '',
      updateChangelog: '',
      changeLogTitle: '',
      isPromptOpen: false,
      lastExternalLinkToBeOpened: '',
      showExternalLinkOpeningPrompt: false,
      externalLinkOpeningPromptValues: [
        'yes',
        'no'
      ]
    }
  },
  computed: {
    showProgressBar: function () {
      return this.$store.getters.getShowProgressBar
    },
    outlinesHidden: function () {
      return this.$store.getters.getOutlinesHidden
    },
    isLocaleRightToLeft: function () {
      return this.locale === 'ar' || this.locale === 'fa' || this.locale === 'he' ||
        this.locale === 'ur' || this.locale === 'yi' || this.locale === 'ku'
    },
    checkForUpdates: function () {
      return this.$store.getters.getCheckForUpdates
    },
    checkForBlogPosts: function () {
      return this.$store.getters.getCheckForBlogPosts
    },
    isKeyboardShortcutPromptShown: function () {
      return this.$store.getters.getIsKeyboardShortcutPromptShown
    },
    showAddToPlaylistPrompt: function () {
      return this.$store.getters.getShowAddToPlaylistPrompt
    },
    showCreatePlaylistPrompt: function () {
      return this.$store.getters.getShowCreatePlaylistPrompt
    },
    showSearchFilters: function () {
      return this.$store.getters.getShowSearchFilters
    },
    windowTitle: function () {
      const routePath = this.$route.path
      if (!routePath.startsWith('/channel/') && !routePath.startsWith('/watch/') && !routePath.startsWith('/hashtag/') && !routePath.startsWith('/playlist/') && !routePath.startsWith('/search/')) {
        let title = translateWindowTitle(this.$route.meta.title)
        if (!title) {
          title = packageDetails.productName
        } else {
          title = `${title} - ${packageDetails.productName}`
        }
        return title
      } else {
        return null
      }
    },
    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },

    defaultInvidiousInstance: function () {
      return this.$store.getters.getDefaultInvidiousInstance
    },

    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
    },

    baseTheme: function () {
      return this.$store.getters.getBaseTheme
    },

    isSideNavOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },

    hideLabelsSideBar: function () {
      return this.$store.getters.getHideLabelsSideBar
    },

    mainColor: function () {
      return this.$store.getters.getMainColor
    },

    secColor: function () {
      return this.$store.getters.getSecColor
    },

    locale: function() {
      return this.$i18n.locale
    },

    systemTheme: function () {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    },

    landingPage: function() {
      return '/' + this.$store.getters.getLandingPage
    },

    externalLinkOpeningPromptNames: function () {
      return [
        this.$t('Yes, Open Link'),
        this.$t('No')
      ]
    },

    externalLinkHandling: function () {
      return this.$store.getters.getExternalLinkHandling
    },

    appTitle: function () {
      return this.$store.getters.getAppTitle
    },
  },
  watch: {
    windowTitle: 'setWindowTitle',

    baseTheme: 'checkThemeSettings',

    mainColor: 'checkThemeSettings',

    secColor: 'checkThemeSettings',

    locale: 'setLocale',

    appTitle: 'setDocumentTitle'
  },
  created () {
    this.checkThemeSettings()
    this.setLocale()
  },
  mounted: function () {
    this.grabUserSettings().then(async () => {
      this.checkThemeSettings()

      await this.fetchInvidiousInstancesFromFile()
      if (this.defaultInvidiousInstance === '') {
        await this.setRandomCurrentInvidiousInstance()
      }

      this.fetchInvidiousInstances().then(e => {
        if (this.defaultInvidiousInstance === '') {
          this.setRandomCurrentInvidiousInstance()
        }
      })

      this.grabAllProfiles(this.$t('Profile.All Channels')).then(async () => {
        this.grabHistory()
        this.grabAllPlaylists()
        this.grabAllSubscriptions()
        this.grabSearchHistoryEntries()

        if (process.env.IS_ELECTRON) {
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

      this.$router.onReady(() => {
        if (this.$router.currentRoute.path === '/') {
          this.$router.replace({ path: this.landingPage })
        }

        this.setWindowTitle()
      })
    })

    document.addEventListener('dragstart', this.handleDragStart)
  },
  beforeDestroy: function () {
    document.removeEventListener('dragstart', this.handleDragStart)
  },
  methods: {
    setDocumentTitle: function(value) {
      document.title = value
    },
    checkThemeSettings: function () {
      const theme = {
        baseTheme: this.baseTheme || 'dark',
        mainColor: this.mainColor || 'mainRed',
        secColor: this.secColor || 'secBlue'
      }

      this.updateTheme(theme)
    },

    updateTheme: function (theme) {
      document.body.className = `${theme.baseTheme} main${theme.mainColor} sec${theme.secColor}`
      document.body.dataset.systemTheme = this.systemTheme
    },

    checkForNewUpdates: function () {
      if (this.checkForUpdates) {
        const requestUrl = 'https://api.github.com/repos/freetubeapp/freetube/releases?per_page=1'

        fetch(requestUrl)
          .then((response) => response.json())
          .then((json) => {
            const tagName = json[0].tag_name
            const versionNumber = tagName.replace('v', '').replace('-beta', '')

            let changelog = json[0].body
              // Link usernames to their GitHub profiles
              .replaceAll(/@(\S+)\b/g, '[@$1](https://github.com/$1)')
              // Shorten pull request links to #1234
              .replaceAll(/https:\/\/github\.com\/FreeTubeApp\/FreeTube\/pull\/(\d+)/g, '[#$1]($&)')

            // Add the title
            changelog = `${changelog}`

            this.updateChangelog = marked.parse(changelog)
            this.changeLogTitle = json[0].name

            this.updateBannerMessage = this.$t('Version {versionNumber} is now available!  Click for more details', { versionNumber })

            const appVersion = packageDetails.version.split('.')
            const latestVersion = versionNumber.split('.')

            if (parseInt(appVersion[0]) < parseInt(latestVersion[0])) {
              this.showUpdatesBanner = true
            } else if (parseInt(appVersion[1]) < parseInt(latestVersion[1])) {
              this.showUpdatesBanner = true
            } else if (parseInt(appVersion[2]) < parseInt(latestVersion[2]) && parseInt(appVersion[1]) <= parseInt(latestVersion[1])) {
              this.showUpdatesBanner = true
            }
          })
          .catch((error) => {
            console.error('errored while checking for updates', requestUrl, error)
          })
      }
    },

    checkForNewBlogPosts: function () {
      if (this.checkForBlogPosts) {
        let lastAppWasRunning = localStorage.getItem('lastAppWasRunning')

        if (lastAppWasRunning !== null) {
          lastAppWasRunning = new Date(lastAppWasRunning)
        }

        fetch('https://write.as/freetube/feed/')
          .then(response => response.text())
          .then(response => {
            const xmlDom = new DOMParser().parseFromString(response, 'application/xml')

            const latestBlog = xmlDom.querySelector('item')
            const latestPubDate = new Date(latestBlog.querySelector('pubDate').textContent)

            if (lastAppWasRunning === null || latestPubDate > lastAppWasRunning) {
              const title = latestBlog.querySelector('title').textContent

              this.blogBannerMessage = this.$t('A new blog is now available, {blogTitle}. Click to view more', { blogTitle: title })
              this.latestBlogUrl = latestBlog.querySelector('link').textContent
              this.showBlogBanner = true
            }

            localStorage.setItem('lastAppWasRunning', new Date())
          })
      }
    },

    checkExternalPlayer: async function () {
      this.getExternalPlayerCmdArgumentsData()
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
        openExternalLink(this.latestBlogUrl)
      }

      this.showBlogBanner = false
    },

    handlePromptPortalUpdate: function(newVal) {
      this.isPromptOpen = newVal
    },

    openDownloadsPage: function () {
      const url = 'https://freetubeapp.io#download'
      openExternalLink(url)
      this.showReleaseNotes = false
      this.showUpdatesBanner = false
    },

    activateKeyboardShortcuts: function () {
      document.addEventListener('keydown', this.handleKeyboardShortcuts)
      document.addEventListener('mousedown', () => {
        this.hideOutlines()
      })
    },

    handleKeyboardShortcuts: function (event) {
      // ignore user typing in HTML `input` elements
      if (event.shiftKey && event.key === '?' && event.target.tagName !== 'INPUT') {
        this.$store.commit('setIsKeyboardShortcutPromptShown', !this.isKeyboardShortcutPromptShown)
      }

      if (event.key === 'Tab') {
        this.showOutlines()
      }
    },

    openAllLinksExternally: function () {
      const isExternalLink = (event) => event.target.tagName === 'A' && !event.target.href.startsWith(window.location.origin)

      document.addEventListener('click', (event) => {
        if (isExternalLink(event)) {
          this.handleLinkClick(event)
        }
      })

      document.addEventListener('auxclick', (event) => {
        // auxclick fires for all clicks not performed with the primary button
        // only handle the link click if it was the middle button,
        // otherwise the context menu breaks
        if (isExternalLink(event) && event.button === 1) {
          this.handleLinkClick(event)
        }
      })
    },

    handleLinkClick: function (event) {
      const el = event.target
      event.preventDefault()

      // Check if it's a YouTube link
      const youtubeUrlPattern = /^https?:\/\/((www\.)?youtube\.com(\/embed)?|youtu\.be)\/.*$/
      const isYoutubeLink = youtubeUrlPattern.test(el.href)

      if (isYoutubeLink) {
        // `auxclick` is the event type for non-left click
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/auxclick_event
        this.handleYoutubeLink(el.href, {
          doCreateNewWindow: event.type === 'auxclick'
        })
      } else if (this.externalLinkHandling === 'doNothing') {
        // Let user know opening external link is disabled via setting
        showToast(this.$t('External link opening has been disabled in the general settings'))
      } else if (this.externalLinkHandling === 'openLinkAfterPrompt') {
        // Storing the URL is necessary as
        // there is no other way to pass the URL to click callback
        this.lastExternalLinkToBeOpened = el.href
        this.showExternalLinkOpeningPrompt = true
      } else {
        // Open links externally
        openExternalLink(el.href)
      }
    },

    handleYoutubeLink: function (href, { doCreateNewWindow = false } = { }) {
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

            openInternalPath({
              path: `/watch/${videoId}`,
              query,
              doCreateNewWindow
            })
            break
          }

          case 'playlist': {
            const { playlistId, query } = result

            openInternalPath({
              path: `/playlist/${playlistId}`,
              query,
              doCreateNewWindow
            })
            break
          }

          case 'search': {
            const { searchQuery, query } = result

            openInternalPath({
              path: `/search/${encodeURIComponent(searchQuery)}`,
              query,
              doCreateNewWindow,
              searchQueryText: searchQuery
            })
            break
          }

          case 'hashtag': {
            const { hashtag } = result
            openInternalPath({
              path: `/hashtag/${encodeURIComponent(hashtag)}`,
              doCreateNewWindow
            })
            break
          }

          case 'post': {
            const { postId, query } = result

            openInternalPath({
              path: `/post/${postId}`,
              query,
              doCreateNewWindow
            })
            break
          }

          case 'channel': {
            const { channelId, subPath, url } = result

            openInternalPath({
              path: `/channel/${channelId}/${subPath}`,
              doCreateNewWindow,
              query: {
                url
              }
            })
            break
          }

          case 'trending':
          case 'subscriptions':
          case 'history':
          case 'userplaylists':
            openInternalPath({
              path: `/${result.urlType}`,
              doCreateNewWindow
            })
            break

          case 'invalid_url': {
            // Do nothing
            break
          }

          default: {
            // Unknown URL type
            showToast(this.$t('Unknown YouTube url type, cannot be opened in app'))
          }
        }
      })
    },

    enableOpenUrl: function () {
      window.ftElectron.handleOpenUrl((url) => {
        if (url) {
          this.handleYoutubeLink(url)
        }
      })
    },

    handleExternalLinkOpeningPromptAnswer: function (option) {
      this.showExternalLinkOpeningPrompt = false

      if (option === 'yes' && this.lastExternalLinkToBeOpened.length > 0) {
        // Maybe user should be notified
        // if `lastExternalLinkToBeOpened` is empty

        // Open links externally
        openExternalLink(this.lastExternalLinkToBeOpened)
      }
    },

    setWindowTitle: function() {
      if (this.windowTitle !== null) {
        this.setAppTitle(this.windowTitle)
      }
    },

    setLocale: function() {
      document.documentElement.lang = this.locale
      if (this.isLocaleRightToLeft) {
        document.body.dir = 'rtl'
      } else {
        document.body.dir = 'ltr'
      }
    },

    /**
     * Transforms dragged in-app URLs into YouTube ones, so they they can be dragged into other applications.
     * Cancels the drag operation if the URL is FreeTube specific and cannot be transformed e.g. user playlist URLs
     * @param {DragEvent} event
     */
    handleDragStart: function (event) {
      if (!event.dataTransfer.types.includes('text/uri-list')) {
        return
      }

      const originalUrlString = event.dataTransfer.getData('text/uri-list')
      const originalUrl = new URL(originalUrlString)

      // Check if this is an in-app URL
      if (originalUrl.origin !== window.location.origin || originalUrl.pathname !== window.location.pathname) {
        return
      }

      const [path, query] = originalUrl.hash.slice(2).split('?')
      const pathParts = path.split('/')
      const params = new URLSearchParams(query)

      let transformed = false
      let transformedURL = new URL('https://www.youtube.com')

      switch (pathParts[0]) {
        case 'watch':
          transformedURL.pathname = '/watch'
          transformedURL.searchParams.set('v', pathParts[1])

          if (params.has('timestamp')) {
            transformedURL.searchParams.set('t', params.get('timestamp') + 's')
          }

          if (params.has('playlistId') && params.get('playlistType') !== 'user') {
            transformedURL.searchParams.set('list', params.get('playlistId'))
          }

          transformed = true
          break
        case 'playlist':
          if (params.get('playlistType') !== 'user') {
            transformedURL.pathname = '/playlist'
            transformedURL.searchParams.set('list', pathParts[1])

            transformed = true
          }
          break
        case 'channel':
          transformedURL.pathname = `/channel/${pathParts[1]}`

          if (pathParts[2]) {
            switch (pathParts[2]) {
              case 'community':
                transformedURL.pathname += '/posts'
                break
              case 'search':
                transformedURL.pathname += '/search'
                if (params.has('searchQueryText')) {
                  transformedURL.searchParams.set('query', params.get('searchQueryText'))
                }
                break
              case 'videos':
              case 'shorts':
              case 'releases':
              case 'podcasts':
              case 'courses':
              case 'playlists':
              case 'about':
                transformedURL.pathname += `/${pathParts[2]}`
                break
            }
          }

          transformed = true
          break
        case 'search':
          transformedURL.pathname = '/results'
          transformedURL.searchParams.set('search_query', decodeURIComponent(pathParts[1]))
          transformed = true
          break
        case 'hashtag':
        case 'post':
          transformedURL.pathname = `/${pathParts[0]}/${pathParts[1]}`
          transformed = true
          break
        case 'subscriptions':
        case 'trending':
        case 'history':
          transformedURL.pathname = `/feed/${pathParts[1]}`
          transformed = true
          break
        case 'userplaylists':
          transformedURL.pathname = '/feed/playlists'
          transformed = true
          break
        case 'settings':
          transformedURL.pathname = '/account'
          transformed = true
          break
        case 'about':
          transformedURL.pathname = '/about'
          transformed = true
          break
        case 'popular':
          transformedURL = new URL(`${this.currentInvidiousInstanceUrl}/feed/popular`)
          transformed = true
          break
      }

      if (transformed) {
        const transformedURLString = transformedURL.toString()

        event.dataTransfer.setData('text/uri-list', transformedURLString)

        const plainText = event.dataTransfer.getData('text/plain')
        if (plainText.length > 0) {
          event.dataTransfer.setData('text/plain', plainText.replaceAll(originalUrlString, transformedURLString))
        }

        const html = event.dataTransfer.getData('text/html')
        if (html.length > 0) {
          const originalUrlStringEncoded = originalUrlString.replaceAll('&', '&amp;')
          const transformedURLStringEncoded = transformedURLString.replaceAll('&', '&amp;')

          event.dataTransfer.setData('text/html', html.replaceAll(originalUrlStringEncoded, transformedURLStringEncoded))
        }
      } else {
        // Cancel the drag operation for FreeTube specific URLs that cannot be transformed such as user playlist URLs
        event.preventDefault()
        event.stopPropagation()
      }
    },

    ...mapActions([
      'grabUserSettings',
      'grabAllProfiles',
      'grabHistory',
      'grabAllPlaylists',
      'grabAllSubscriptions',
      'grabSearchHistoryEntries',
      'getYoutubeUrlInfo',
      'getExternalPlayerCmdArgumentsData',
      'fetchInvidiousInstances',
      'fetchInvidiousInstancesFromFile',
      'setRandomCurrentInvidiousInstance',
      'setupListenersToSyncWindows',
      'hideKeyboardShortcutPrompt',
      'showKeyboardShortcutPrompt',
      'updateBaseTheme',
      'updateMainColor',
      'updateSecColor',
      'showOutlines',
      'hideOutlines',
    ]),

    ...mapMutations([
      'setAppTitle'
    ])
  }
})
