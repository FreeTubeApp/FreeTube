/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner.
 */

import history from './history'
import invidious from './invidious'
import playlists from './playlists'
import profiles from './profiles'
import settings from './settings'
import subscriptions from './subscriptions'
import utils from './utils'

export default {
  history,
  invidious,
  playlists,
  profiles,
  settings,
  subscriptions,
  utils
}
