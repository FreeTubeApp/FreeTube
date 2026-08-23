import { computed, inject, provide, ref, shallowReactive } from 'vue'

const SETTINGS_SEARCH_KEY = Symbol('settingsSearch')

/** Lets a nested FtSetting communicate its match state to the FtSetting that wraps it. */
export const SETTINGS_GROUP_KEY = Symbol('settingsGroup')

export function provideSettingsSearch() {
  const searchQuery = ref('')
  const isSearching = computed(() => searchQuery.value.trim() !== '')

  /** Visibility of every top-level FtSetting (settings section), keyed by section id. */
  const sectionVisibility = shallowReactive(new Map())

  /**
   * @param {string} query
   */
  function setSettingsSearchQuery(query) {
    searchQuery.value = query
  }

  /**
   * @param {string} sectionId
   * @param {import('vue').ComputedRef<boolean>} visibilityRef
   */
  function registerSection(sectionId, visibilityRef) {
    sectionVisibility.set(sectionId, visibilityRef)
  }

  /**
   * @param {string} sectionId
   */
  function unregisterSection(sectionId) {
    sectionVisibility.delete(sectionId)
  }

  /**
   * @param {string} sectionId
   */
  function isSectionVisible(sectionId) {
    // sections that never registered (e.g. not rendered yet) stay visible
    return sectionVisibility.get(sectionId)?.value ?? true
  }

  const settingsSearch = {
    searchQuery,
    isSearching,
    setSettingsSearchQuery,
    registerSection,
    unregisterSection,
    isSectionVisible
  }

  provide(SETTINGS_SEARCH_KEY, settingsSearch)

  return settingsSearch
}

export function useSettingsSearch() {
  const settingsSearch = inject(SETTINGS_SEARCH_KEY)

  if (settingsSearch == null) {
    throw new Error('Settings search has not been provided')
  }

  return settingsSearch
}
