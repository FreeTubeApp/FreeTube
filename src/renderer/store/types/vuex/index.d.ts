import Vue, { ComponentOptions } from 'vue'

import {
  Commit,
  Dispatch,
  Getters,
  Modules,
  Mutations,
  RemainingActions,
  RootState,
  SettingsActions
} from '../_internal'


export declare class Store {
  constructor(options: {
    modules: Modules,
    strict?: boolean,
    plugins?: Plugin[]
  })

  readonly state: RootState
  readonly getters: Getters

  dispatch: Dispatch
  commit: Commit
}

export type Plugin = (store: Store) => any;

export { Commit, Dispatch }

export declare function install(vue: typeof Vue): void;


export declare const mapMutations: <Key extends keyof Mutations>(map: Key[]) => {
  [K in Key]: (...payload: Mutations[K]) => void
}

export declare const mapGetters: <Key extends keyof Getters>(map: Key[]) => {
  [K in Key]: () => Getters[K]
}

export declare const mapActions: <Key extends (keyof SettingsActions | keyof RemainingActions)>
    (map: Key[]) => {
      [K in Key]: K extends keyof SettingsActions
      ? (value: SettingsActions[K]) => Promise<void>
      : (...payload: RemainingActions[K]['payload']) => RemainingActions[K]['returnType']
    }


declare const _default: {
  Store: typeof Store,
  install: typeof install,
  mapMutations: typeof mapMutations,
  mapGetters: typeof mapGetters,
  mapActions: typeof mapActions
}

export default _default

/**
 * Extend interfaces in Vue.js
 */

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    store?: Store
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: Store
  }
}
