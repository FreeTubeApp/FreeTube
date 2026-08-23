<template>
  <FtInput
    :placeholder="t('Settings.Search Settings')"
    :show-action-button="false"
    show-clear-text-button
    :value="filterQuery"
    @input="handleInput"
    @clear="handleClear"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import FtInput from '../FtInput/FtInput.vue'

import { usePageFilter } from '../../composables/page-filter'
import { debounce } from '../../helpers/utils'

const { t } = useI18n()

const { filterQuery, setFilterQuery } = usePageFilter()

const handleInput = debounce((value) => {
  setFilterQuery(value)
}, 200)

function handleClear() {
  handleInput.cancel()
  setFilterQuery('')
}

onUnmounted(handleInput.cancel)
</script>
