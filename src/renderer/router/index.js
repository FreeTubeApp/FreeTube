import Vue from 'vue'
import Router from 'vue-router'
import Subscriptions from '../views/Subscriptions/Subscriptions.vue'
import SubscribedChannels from '../views/SubscribedChannels/SubscribedChannels.vue'
import ProfileSettings from '../views/ProfileSettings/ProfileSettings.vue'
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
import Hashtag from '../views/Hashtag/Hashtag.vue'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'default',
      component: Subscriptions
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: Subscriptions
    },
    {
      path: '/subscribedchannels',
      name: 'subscribedChannels',
      component: SubscribedChannels
    },
    {
      path: '/trending',
      name: 'trending',
      component: Trending
    },
    {
      path: '/popular',
      name: 'popular',
      component: Popular
    },
    {
      path: '/userplaylists',
      name: 'userPlaylists',
      component: UserPlaylists
    },
    {
      path: '/history',
      name: 'history',
      component: History
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    },
    {
      path: '/about',
      name: 'about',
      component: About
    },
    {
      path: '/settings/profile',
      name: 'profileSettings',
      component: ProfileSettings
    },
    {
      path: '/search/:query',
      name: 'search',
      component: Search
    },
    {
      name: 'playlist',
      path: '/playlist/:id',
      component: Playlist
    },
    {
      path: '/channel/:id/:currentTab?',
      name: 'channel',
      component: Channel
    },
    {
      path: '/watch/:id',
      name: 'watch',
      component: Watch
    },
    {
      path: '/hashtag/:hashtag',
      name: 'hashtag',
      component: Hashtag
    }
  ],
  scrollBehavior(to, from, savedPosition) {
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

const originalPush = router.push.bind(router)

router.push = (location) => {
  // only navigates if the location is not identical to the current location

  const currentQueryUSP = new URLSearchParams(router.currentRoute.query)
  let newPath = ''
  let newQueryUSP = new URLSearchParams()

  if (typeof location === 'string') {
    if (location.includes('?')) {
      const urlParts = location.split('?')
      newPath = urlParts[0]
      newQueryUSP = new URLSearchParams(urlParts[1])
    } else {
      newPath = location
      // newQueryUSP already empty
    }
  } else {
    newPath = location.path
    newQueryUSP = new URLSearchParams(location.query)
  }

  const pathsAreDiff = router.currentRoute.path !== newPath
  // Comparing `URLSearchParams` objects directly will always be different
  const queriesAreDiff = newQueryUSP.toString() !== currentQueryUSP.toString()

  if (pathsAreDiff || queriesAreDiff) {
    return originalPush(location)
  }
}

export default router
