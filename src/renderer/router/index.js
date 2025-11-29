import { createRouter, createWebHashHistory } from 'vue-router'
import Subscriptions from '../views/Subscriptions/Subscriptions.vue'
import SubscribedChannels from '../views/SubscribedChannels/SubscribedChannels.vue'
import ProfileSettings from '../views/ProfileSettings/ProfileSettings.vue'
import Trending from '../views/Trending/Trending.vue'
import Popular from '../views/Popular/Popular.vue'
import UserPlaylists from '../views/UserPlaylists/UserPlaylists.vue'
import History from '../views/History/History.vue'
import Settings from '../views/Settings/Settings.vue'
import About from '../views/About/About.vue'
import SearchPage from '../views/SearchPage/SearchPage.vue'
import Playlist from '../views/Playlist/Playlist.vue'
import Channel from '../views/Channel/Channel.vue'
import Watch from '../views/Watch/Watch.vue'
import Hashtag from '../views/Hashtag/Hashtag.vue'
import Post from '../views/Post.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'default',
      meta: {
        title: 'Subscriptions'
      },
      component: Subscriptions
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      meta: {
        title: 'Subscriptions'
      },
      component: Subscriptions
    },
    {
      path: '/subscribedchannels',
      name: 'subscribedChannels',
      meta: {
        title: 'Channels'
      },
      component: SubscribedChannels
    },
    ...(process.env.SUPPORTS_LOCAL_API
      ? [{
          path: '/trending',
          name: 'trending',
          meta: {
            title: 'Trending'
          },
          component: Trending
        }]
      : []),
    {
      path: '/popular',
      name: 'popular',
      meta: {
        title: 'Most Popular'
      },
      component: Popular
    },
    {
      path: '/userplaylists',
      name: 'userPlaylists',
      meta: {
        title: 'Your Playlists'
      },
      component: UserPlaylists
    },
    {
      path: '/history',
      name: 'history',
      meta: {
        title: 'History'
      },
      component: History
    },
    {
      path: '/settings',
      name: 'settings',
      meta: {
        title: 'Settings'
      },
      component: Settings
    },
    {
      path: '/about',
      name: 'about',
      meta: {
        title: 'About'
      },
      component: About
    },
    {
      path: '/settings/profile',
      name: 'profileSettings',
      meta: {
        title: 'Profile Settings'
      },
      component: ProfileSettings
    },
    {
      path: '/search/:query',
      meta: {
        title: 'Search Results'
      },
      component: SearchPage
    },
    {
      path: '/playlist/:id',
      meta: {
        title: 'Playlist'
      },
      component: Playlist
    },
    {
      path: '/channel/:id/:currentTab?',
      meta: {
        title: 'Channel'
      },
      component: Channel
    },
    {
      path: '/watch/:id',
      meta: {
        title: 'Watch'
      },
      component: Watch
    },
    {
      path: '/hashtag/:hashtag',
      meta: {
        title: 'Hashtag'
      },
      component: Hashtag
    },
    {
      path: '/post/:id',
      meta: {
        title: 'Post',
      },
      component: Post
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (savedPosition !== null) {
          resolve(savedPosition)
        } else {
          resolve({ left: 0, top: 0 })
        }
      }, 500)
    })
  }
})

export default router
