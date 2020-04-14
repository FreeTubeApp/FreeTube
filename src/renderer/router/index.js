import Vue from 'vue'
import Router from 'vue-router'
import Subscriptions from '../views/Subscriptions/Subscriptions.vue'
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
        title: 'Subscriptions',
        icon: 'fa-home'
      },
      component: Subscriptions
    },
    {
      path: '/subscriptions',
      meta: {
        title: 'Subscriptions',
        icon: 'fa-home'
      },
      component: Subscriptions
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
        title: 'User Playlists',
        icon: 'fa-home'
      },
      component: UserPlaylists
    },
    {
      path: '/history',
      meta: {
        title: 'History',
        icon: 'fa-home'
      },
      component: History
    },
    {
      path: '/settings',
      meta: {
        title: 'Settings',
        icon: 'fa-home'
      },
      component: Settings
    },
    {
      path: '/about',
      meta: {
        title: 'About',
        icon: 'fa-home'
      },
      component: About
    },
    {
      path: '/search/:query',
      meta: {
        title: 'Search',
        icon: 'fa-home'
      },
      component: Search
    },
    {
      path: '/playlist/:id',
      meta: {
        title: 'Playlist',
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

// dynamically set application title to current view
router.afterEach(to => {
  let title =
    to.path === '/home'
      ? process.env.PRODUCT_NAME
      : `${to.meta.title} - ${process.env.PRODUCT_NAME}`

  if (!title) {
    title = 'Home'
  }

  document.title = title
})

export default router
