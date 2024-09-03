/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner.
 */

import history from './history'
import invidious from './invidious'
import playlists from './playlists'
import profiles from './profiles'
import settings from './settings'
import subscriptionCache from './subscription-cache'
import utils from './utils'
import player from './player'

export default {
  history,
  invidious,
  playlists,
  profiles,
  settings,
  subscriptionCache,
  utils,
  player,
}
