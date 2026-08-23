import { computed, ref, shallowReactive } from 'vue'

// Module-level shared state so that the search query entered in the
// Settings view is shared across every settings section component.
const searchQuery = ref('')

/** Visibility of every top-level FtSetting (settings section), keyed by section id. */
const sectionVisibility = shallowReactive(new Map())

/** Lets a nested FtSetting communicate its match state to the FtSetting that wraps it. */
export const SETTINGS_GROUP_KEY = Symbol('settingsGroup')

export function useSettingsSearch() {
  const isSearching = computed(() => searchQuery.value.trim() !== '')

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

  return {
    searchQuery,
    isSearching,
    setSettingsSearchQuery,
    registerSection,
    unregisterSection,
    isSectionVisible
  }
}
