<template>
  <FtInput
    :placeholder="t('Settings.Search Settings')"
    :show-action-button="false"
    show-clear-text-button
    :value="searchQuery"
    @input="handleInput"
    @clear="handleClear"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import FtInput from '../FtInput/FtInput.vue'

import { useSettingsSearch } from '../../composables/settings-search'
import { debounce } from '../../helpers/utils'

const { t } = useI18n()

const { searchQuery, setSettingsSearchQuery } = useSettingsSearch()

const handleInput = debounce((value) => {
  setSettingsSearchQuery(value)
}, 200)

function handleClear() {
  handleInput.cancel()
  setSettingsSearchQuery('')
}

onUnmounted(handleInput.cancel)
</script>
