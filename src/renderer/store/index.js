import { createStore } from 'vuex'
// import createPersistedState from 'vuex-persistedstate'
import modules from './modules'

export default createStore({
  modules,
  strict: process.env.NODE_ENV !== 'production',

  // TODO: Enable when deploy
  // plugins: [createPersistedState()]

  // Debugging vuex:
  // import { createLogger } from 'vuex'
  // plugins: [createLogger()]
})
