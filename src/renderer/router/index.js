import Vue from 'vue'
import Router from 'vue-router'
import Subscriptions from '../views/Subscriptions/Subscriptions.vue'
import ProfileSettings from '../views/ProfileSettings/ProfileSettings.vue'
import ProfileEdit from '../views/ProfileEdit/ProfileEdit.vue'
import Trending from '../views/Trending/Trending.vue'
import Popular from '../views/Popular/Popular.vue'
import UserPlaylists from '../views/UserPlaylists/UserPlaylists.vue'
import History from '../views/History/History.vue'
import Settings from '../views/Settings/Settings.vue'
import About from '../views/About/About.vue'
import Search from '../views/Search/Search.vue'
import Playlist from '../views/Playlist/Playlist.vue'
import Channel from '../views/Channel/Channel.vue'
import Watch from '../views/Watch/Watch.vue'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      meta: {
        title: 'Subscriptions.Subscriptions',
        icon: 'fa-home'
      },
      component: Subscriptions
    },
    {
      path: '/subscriptions',
      meta: {
        title: 'Subscriptions.Subscriptions',
        icon: 'fa-home'
      },
      component: Subscriptions
    },
    {
      path: '/settings/profile',
      meta: {
        title: 'Profile.Profile Settings',
        icon: 'fa-home'
      },
      component: ProfileSettings
    },
    {
      path: '/settings/profile/new',
      name: 'newProfile',
      meta: {
        title: 'Profile.Create New Profile',
        icon: 'fa-home'
      },
      component: ProfileEdit
    },
    {
      path: '/settings/profile/edit/:id',
      name: 'editProfile',
      meta: {
        title: 'Profile.Edit Profile',
        icon: 'fa-home'
      },
      component: ProfileEdit
    },
    {
      path: '/trending',
      meta: {
        title: 'Trending',
        icon: 'fa-home'
      },
      component: Trending
    },
    {
      path: '/popular',
      meta: {
        title: 'Most Popular',
        icon: 'fa-home'
      },
      component: Popular
    },
    {
      path: '/userplaylists',
      meta: {
        title: 'User Playlists.Your Playlists',
        icon: 'fa-home'
      },
      component: UserPlaylists
    },
    {
      path: '/history',
      name: 'history',
      meta: {
        title: 'History.History',
        icon: 'fa-home'
      },
      component: History
    },
    {
      path: '/settings',
      meta: {
        title: 'Settings.Settings',
        icon: 'fa-home'
      },
      component: Settings
    },
    {
      path: '/about',
      meta: {
        title: 'About.About',
        icon: 'fa-home'
      },
      component: About
    },
    {
      path: '/search/:query',
      meta: {
        title: 'Search Filters.Search Results',
        icon: 'fa-home'
      },
      component: Search
    },
    {
      path: '/playlist/:id',
      meta: {
        title: 'Playlist.Playlist',
        icon: 'fa-home'
      },
      component: Playlist
    },
    {
      path: '/channel/:id',
      meta: {
        title: 'Channel',
        icon: 'fa-user'
      },
      component: Channel
    },
    {
      path: '/watch/:id',
      meta: {
        title: 'Watch',
        icon: 'fa-user'
      },
      component: Watch
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (savedPosition !== null) {
          resolve(savedPosition)
        } else {
          resolve({ x: 0, y: 0 })
        }
      }, 500)
    })
  }
})

// return true if it is a selection event, false if it is a navigation event
Vue.prototype.$handleDropdownKeyboardEvent = function(event, afterElement) {
  if (event instanceof KeyboardEvent) {
    let nextElement = null
    if (event.key === 'Tab') {
      if (afterElement) {
        afterElement.tabindex = 0
        afterElement.focus()
      }
      return false
    } if (event.key === 'ArrowUp') {
      nextElement = event.target.previousElementSibling ?? event.target.parentNode.lastElementChild
    } else if (event.key === 'ArrowDown') {
      nextElement = event.target.nextElementSibling ?? event.target.parentNode.firstElementChild
    } else if (event.key === 'Home') {
      nextElement = event.target.parentNode.firstElementChild
    } else if (event.key === 'End') {
      nextElement = event.target.parentNode.lastElementChild
    }

    event.preventDefault()

    if (nextElement) {
      event.target.setAttribute('tabindex', '-1')
      nextElement.setAttribute('tabindex', '0')
      nextElement.focus()
    }

    return event.key === 'Enter' || event.key === ' '
  }
}

export default router
