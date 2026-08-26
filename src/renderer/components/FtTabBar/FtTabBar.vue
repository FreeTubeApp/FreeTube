<template>
  <Transition name="tabBar">
    <div
      v-if="tabs.length > 1"
      class="ftTabBar"
      role="tablist"
      :aria-label="t('Tabs.Open Tabs')"
    >
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: tab.id === activeTabId }"
        role="tab"
        tabindex="0"
        :aria-selected="tab.id === activeTabId"
        :title="tab.title"
        @click="activate(tab.id)"
        @keydown.enter.space.prevent="activate(tab.id)"
        @auxclick.middle="close(tab.id)"
      >
        <FontAwesomeIcon
          class="tabIcon"
          :icon="['fab', 'youtube']"
        />
        <span class="title">{{ tab.title || t('Tabs.New Tab') }}</span>
        <button
          class="closeButton"
          :aria-label="t('Tabs.Close Tab')"
          :title="t('Tabs.Close Tab')"
          @click.stop="close(tab.id)"
        >
          <FontAwesomeIcon
            class="closeIcon"
            :icon="['fas', 'xmark']"
          />
        </button>
      </div>
      <button
        class="newTabButton"
        :aria-label="t('Tabs.New Tab')"
        :title="t('Tabs.New Tab')"
        @click="openNewTab"
      >
        <FontAwesomeIcon
          class="newTabIcon"
          :icon="['fas', 'plus']"
        />
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import store from '../../store/index'

const { t } = useI18n()

/** @type {import('vue').ComputedRef<object[]>} */
const tabs = computed(() => store.getters.getTabs)

/** @type {import('vue').ComputedRef<number | null>} */
const activeTabId = computed(() => store.getters.getActiveTabId)

/**
 * @param {number} tabId
 */
function activate(tabId) {
  if (tabId === activeTabId.value) {
    return
  }

  store.dispatch('activateTab', tabId)
}

/**
 * @param {number} tabId
 */
function close(tabId) {
  store.dispatch('closeTab', tabId)
}

function openNewTab() {
  store.dispatch('openNewTab')
}
</script>

<style scoped src="./FtTabBar.css" />
