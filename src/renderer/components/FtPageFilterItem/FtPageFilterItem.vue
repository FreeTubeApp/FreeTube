<template>
  <div
    v-show="isVisible"
    :id="id"
    class="ftPageFilterItem"
  >
    <slot />
  </div>
</template>

<script setup>
import { computed, inject, onUnmounted, provide, shallowReactive, useId } from 'vue'

import { PAGE_FILTER_ITEM_GROUP_KEY, usePageFilter } from '../../composables/page-filter'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  keyword: {
    type: String,
    required: true
  }
})

const { filterQuery, registerRootItem, unregisterRootItem } = usePageFilter()

const query = computed(() => filterQuery.value.trim().toLowerCase())

const parentGroup = inject(PAGE_FILTER_ITEM_GROUP_KEY, null)

/** Match state of every FtPageFilterItem nested directly inside this one, keyed by instance id. */
const childMatches = shallowReactive(new Map())

const matchesSelf = computed(() => {
  return query.value !== '' && props.keyword.toLowerCase().includes(query.value)
})

const matchesDescendant = computed(() => {
  for (const childMatch of childMatches.values()) {
    if (childMatch.value) {
      return true
    }
  }

  return false
})

const matches = computed(() => matchesSelf.value || matchesDescendant.value)

// A group that matches on its own keyword reveals everything nested inside it.
const matchesAncestor = computed(() => {
  return parentGroup != null && (parentGroup.matchesSelf.value || parentGroup.matchesAncestor.value)
})

const isVisible = computed(() => {
  return query.value === '' || matchesAncestor.value || matches.value
})

if (parentGroup != null) {
  const instanceId = useId()

  parentGroup.register(instanceId, matches)
  onUnmounted(() => parentGroup.unregister(instanceId))
} else {
  registerRootItem(props.id, isVisible)
  onUnmounted(() => unregisterRootItem(props.id))
}

provide(PAGE_FILTER_ITEM_GROUP_KEY, {
  matchesSelf,
  matchesAncestor,
  /**
   * @param {string} instanceId
   * @param {import('vue').ComputedRef<boolean>} matchRef
   */
  register(instanceId, matchRef) {
    childMatches.set(instanceId, matchRef)
  },
  /**
   * @param {string} instanceId
   */
  unregister(instanceId) {
    childMatches.delete(instanceId)
  }
})
</script>

<style scoped src="./FtPageFilterItem.css" />
