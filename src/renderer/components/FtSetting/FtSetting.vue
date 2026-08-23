<template>
  <div
    v-show="isVisible"
    :id="`setting-${id}`"
    class="ftSetting"
  >
    <slot />
  </div>
</template>

<script setup>
import { computed, inject, onUnmounted, provide, shallowReactive, useId } from 'vue'

import { SETTINGS_GROUP_KEY, useSettingsSearch } from '../../composables/settings-search'

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

const { searchQuery, registerSection, unregisterSection } = useSettingsSearch()

const query = computed(() => searchQuery.value.trim().toLowerCase())

const parentGroup = inject(SETTINGS_GROUP_KEY, null)

/** Match state of every FtSetting nested directly inside this one, keyed by instance id. */
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
  // Top-level FtSettings are the settings sections; expose their visibility to the menu.
  registerSection(props.id, isVisible)
  onUnmounted(() => unregisterSection(props.id))
}

provide(SETTINGS_GROUP_KEY, {
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

<style scoped src="./FtSetting.css" />
