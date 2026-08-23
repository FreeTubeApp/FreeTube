import { computed, inject, provide, ref, shallowReactive } from 'vue'

const PAGE_FILTER_KEY = Symbol('pageFilter')

/** Lets a nested FtPageFilterItem communicate its match state to the FtPageFilterItem that wraps it. */
export const PAGE_FILTER_ITEM_GROUP_KEY = Symbol('pageFilterItemGroup')

export function providePageFilter() {
  const filterQuery = ref('')
  const isFiltering = computed(() => filterQuery.value.trim() !== '')

  /** Visibility of every top-level FtPageFilterItem, keyed by item id. */
  const rootItemVisibility = shallowReactive(new Map())

  /**
   * @param {string} query
   */
  function setFilterQuery(query) {
    filterQuery.value = query
  }

  /**
   * @param {string} itemId
   * @param {import('vue').ComputedRef<boolean>} visibilityRef
   */
  function registerRootItem(itemId, visibilityRef) {
    rootItemVisibility.set(itemId, visibilityRef)
  }

  /**
   * @param {string} itemId
   */
  function unregisterRootItem(itemId) {
    rootItemVisibility.delete(itemId)
  }

  /**
   * @param {string} itemId
   */
  function isRootItemVisible(itemId) {
    // Items that never registered (e.g. not rendered yet) stay visible.
    return rootItemVisibility.get(itemId)?.value ?? true
  }

  const pageFilter = {
    filterQuery,
    isFiltering,
    setFilterQuery,
    registerRootItem,
    unregisterRootItem,
    isRootItemVisible
  }

  provide(PAGE_FILTER_KEY, pageFilter)

  return pageFilter
}

export function usePageFilter() {
  const pageFilter = inject(PAGE_FILTER_KEY)

  if (pageFilter == null) {
    throw new Error('Page filter has not been provided')
  }

  return pageFilter
}
