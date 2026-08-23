import { computed, ref } from 'vue'

// Module-level shared state so that the search query entered in the
// Settings view is shared across every settings section component.
const searchQuery = ref('')

export function useSettingsSearch() {
  const isSearching = computed(() => searchQuery.value.trim() !== '')

  /**
   * @param {string} query
   */
  function setSettingsSearchQuery(query) {
    searchQuery.value = query
  }

  return {
    searchQuery,
    isSearching,
    setSettingsSearchQuery
  }
}
