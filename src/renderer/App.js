import Vue from 'vue'
import TopNav from './components/top-nav/top-nav.vue'
import SideNav from './components/side-nav/side-nav.vue'
import $ from 'jquery'
import { shell } from 'electron'

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

    // Open links externally by default
    $(document).on('click', 'a[href^="http"]', (event) => {
      const el = event.currentTarget
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
