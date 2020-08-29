import Vue from 'vue'
import { ObserveVisibility } from 'vue-observe-visibility'
import TopNav from './components/top-nav/top-nav.vue'
import SideNav from './components/side-nav/side-nav.vue'
import FtToast from './components/ft-toast/ft-toast.vue'
import $ from 'jquery'

let useElectron
let shell

Vue.directive('observe-visibility', ObserveVisibility)

if (window && window.process && window.process.type === 'renderer') {
  /* eslint-disable-next-line */
  shell = require('electron').shell
  useElectron = true
} else {
  useElectron = false
}

export default Vue.extend({
  name: 'App',
  components: {
    TopNav,
    SideNav,
    FtToast
  },
  computed: {
    isOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    }
  },
  mounted: function () {
    this.$store.dispatch('grabUserSettings')
    this.$store.dispatch('grabHistory')
    this.$store.commit('setUsingElectron', useElectron)
    this.checkThemeSettings()
    this.checkLocale()

    if (useElectron) {
      console.log('User is using Electron')
      this.activateKeyboardShortcuts()
      this.openAllLinksExternally()
    }

    // try {
    //   const doc = yaml.safeLoad(fs.readFileSync('./static/locales/en-US.yaml'))
    //   console.log(doc)
    // } catch (e) {
    //   console.log(e)
    // }
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

    activateKeyboardShortcuts: function () {
      $(document).on('keydown', this.handleKeyboardShortcuts)
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
    }
  }
})
