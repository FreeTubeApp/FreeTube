import Vue from 'vue'
import TopNav from './components/top-nav/top-nav.vue'
import SideNav from './components/side-nav/side-nav.vue'
import $ from 'jquery'

let useElectron
let shell

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
    SideNav
  },
  computed: {
    isOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    }
  },
  mounted: function () {
    this.$store.dispatch('grabUserSettings')

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

    console.log(useElectron)

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
  methods: {
    updateTheme: function (theme) {
      console.log(theme)
      const className = `${theme.baseTheme} ${theme.mainColor} ${theme.secColor}`
      const body = document.getElementsByTagName('body')[0]
      body.className = className
      localStorage.setItem('baseTheme', theme.baseTheme)
      localStorage.setItem('mainColor', theme.mainColor)
      localStorage.setItem('secColor', theme.secColor)
    }
  }
})
