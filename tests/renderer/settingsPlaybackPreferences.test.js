import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import settingsModule from '../../src/renderer/store/modules/settings'
import { resetSettingsDatabase } from '../mocks/settingsDatabase'

vi.mock('../../src/renderer/i18n/index', () => ({
  default: { global: { locale: { value: 'en-US' } } },
  loadLocale: vi.fn(async () => {})
}))

vi.mock('../../src/renderer/helpers/utils', () => ({
  getSystemLocale: vi.fn(async () => 'en-US'),
  showToast: vi.fn()
}))

function createIndependentStore() {
  return createStore({
    modules: {
      settings: {
        ...settingsModule,
        state: structuredClone(settingsModule.state)
      }
    },
    actions: {
      getRegionData: vi.fn()
    }
  })
}

describe('settings playback preference persistence', () => {
  beforeEach(() => {
    resetSettingsDatabase()

    globalThis.sessionStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(() => null)
    }
  })

  it('persists preferences and restores them in a fresh store after reload', async () => {
    const firstStore = createIndependentStore()

    await firstStore.dispatch('updateLastPlaybackRate', 1.5)
    await firstStore.dispatch('updateLastVolume', { volume: 0.4, muted: true })
    await firstStore.dispatch('updateLastCaptionPreference', { enabled: true, language: 'pt-BR' })

    const restartedStore = createIndependentStore()

    expect(restartedStore.getters.getLastPlaybackRate).toBeNull()
    expect(restartedStore.getters.getLastVolume).toBeNull()
    expect(restartedStore.getters.getLastCaptionPreference).toBeNull()

    await restartedStore.dispatch('grabUserSettings')

    expect(restartedStore.getters.getLastPlaybackRate).toBe(1.5)
    expect(restartedStore.getters.getLastVolume).toEqual({ volume: 0.4, muted: true })
    expect(restartedStore.getters.getLastCaptionPreference).toEqual({ enabled: true, language: 'pt-BR' })
  })

  it('updates remembered preferences when existing defaults change', async () => {
    const store = createIndependentStore()

    await store.dispatch('updateDefaultPlayback', 1.75)
    await store.dispatch('updateDefaultVolume', 0.65)
    await store.dispatch('updateEnableSubtitlesByDefault', true)

    expect(store.getters.getLastPlaybackRate).toBe(1.75)
    expect(store.getters.getLastVolume).toEqual({ volume: 0.65, muted: false })
    expect(store.getters.getLastCaptionPreference).toEqual({ enabled: true, language: null })

    const restartedStore = createIndependentStore()
    await restartedStore.dispatch('grabUserSettings')

    expect(restartedStore.getters.getDefaultPlayback).toBe(1.75)
    expect(restartedStore.getters.getDefaultVolume).toBe(0.65)
    expect(restartedStore.getters.getEnableSubtitlesByDefault).toBe(true)
    expect(restartedStore.getters.getLastPlaybackRate).toBe(1.75)
    expect(restartedStore.getters.getLastVolume).toEqual({ volume: 0.65, muted: false })
    expect(restartedStore.getters.getLastCaptionPreference).toEqual({ enabled: true, language: null })
  })
})
