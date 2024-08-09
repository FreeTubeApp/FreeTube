import modules from '../modules/index.js'
import {
  SettingsCustomActions,
  SettingsStateWithSideEffects
} from '../modules/settings.js'

export type Modules = typeof modules
type ModulesExludingSettings = Omit<Modules, 'settings'>

// I don't understand how this works, I copied it from somewhere, but it works and that's all that matters
type AllOfCategory<Category extends 'getters' | 'mutations' | 'actions'> = {
  [K in keyof ModulesExludingSettings]: (x: ModulesExludingSettings[K][Category]) => void
}[keyof ModulesExludingSettings] extends
  (x: infer I) => void ? { [K in keyof I]: I[K] } : never;


interface AllRemainingActions extends AllOfCategory<'actions'>, SettingsCustomActions {
}

type RemainingActionsReturnType<K> =
  ReturnType<AllRemainingActions[K]> extends Promise<any>
  ? ReturnType<AllRemainingActions[K]>
  : Promise<ReturnType<AllRemainingActions[K]>>

export type RemainingActions = {
  [K in keyof AllRemainingActions]: Parameters<AllRemainingActions[K]>['length'] extends 1
  ? {
    payload: [],
    returnType: RemainingActionsReturnType<K>
  }
  : {
    payload: [payload: Parameters<AllRemainingActions[K]>[1]],
    returnType: RemainingActionsReturnType<K>
  }
}

export type SettingsActions = {
  [K in keyof SettingsState as `update${Capitalize<K>}`]: SettingsState[K]
}


type AllMutations = AllOfCategory<'mutations'>

export type Mutations = {
  [K in keyof AllMutations]: Parameters<AllMutations[K]>['length'] extends 1
  ? []
  : [payload: Parameters<AllMutations[K]>[1]]
}

type SettingsStateWithoutSideEffects = {
  [K in keyof Modules['settings']['state']]: Modules['settings']['state'][K]
}

interface SettingsState extends SettingsStateWithoutSideEffects, SettingsStateWithSideEffects { }

type RemainingState = {
  [K in keyof ModulesExludingSettings]: ModulesExludingSettings[K]['state']
}

export interface RootState extends RemainingState {
  settings: SettingsState
}

export interface Dispatch {
  <K extends keyof SettingsActions>(settingId: K, value: SettingsActions[K]): Promise<void>,
  <K extends keyof RemainingActions>(type: K, ...payload: RemainingActions[K]['payload']): RemainingActions[K]['returnType']
}

export interface Commit {
  <K extends keyof Mutations>(type: K, ...payload: Mutations[K]): void
}

type SettingsGetters = {
  [K in keyof SettingsState as `get${Capitalize<K>}`]: SettingsState[K]
}

type RemainingGetters = {
  [K in keyof AllOfCategory<'getters'>]: ReturnType<AllOfCategory<'getters'>[K]>
}

export interface Getters extends SettingsGetters, RemainingGetters { }

export interface ActionContext<S> {
  dispatch: Dispatch,
  commit: Commit,
  readonly state: S,
  readonly getters: Getters,
  // should be RootState, but doing that makes TypeScript complain about it referencing itself
  readonly rootState: {
    settings: SettingsState
  },
  rootGetters: any
}
