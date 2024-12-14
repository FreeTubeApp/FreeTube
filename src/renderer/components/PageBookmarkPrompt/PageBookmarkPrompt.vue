<template>
  <FtPrompt
    :label="title"
    @click="hide"
  >
    <h2 class="heading">
      {{ title }}
    </h2>
    <div
      class="pageBookmarkDetails"
    >
      <FtInput
        ref="pageBookmarkNameInput"
        class="pageBookmarkNameInput"
        :placeholder="t('Name')"
        :value="name"
        :show-clear-text-button="true"
        :show-action-button="false"
        @input="e => handleNameChange(e)"
        @clear="e => handleNameChange('')"
        @keydown.enter.native="save"
      />
      <FtFlexBox v-if="duplicateNameCount > 0">
        <p>{{ $tc('Page Bookmark["There is {count} other bookmark with the same name."]', duplicateNameCount, { count: duplicateNameCount }) }}</p>
      </FtFlexBox>
    </div>
    <div>
      <FtFlexBox class="actions-container">
        <FtButton
          v-if="!isBookmarkBeingCreated"
          :label="t('Page Bookmark.Remove Bookmark')"
          :icon="['fas', 'trash']"
          text-color="var(--destructive-text-color)"
          background-color="var(--destructive-color)"
          @click="removeBookmark"
        />
        <FtButton
          :label="t('Save')"
          :disabled="name === ''"
          text-color="var(--text-with-accent-color)"
          background-color="var(--accent-color)"
          @click="save"
        />
        <FtButton
          :label="t('Cancel')"
          :text-color="null"
          :background-color="null"
          @click="hide"
        />
      </FtFlexBox>
    </div>
  </FtPrompt>
</template>

<script setup>

import { computed, nextTick, onMounted, ref } from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import packageDetails from '../../../../package.json'
import { showToast } from '../../helpers/utils'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { useRouter } from 'vue-router/composables'
import store from '../../store'

const router = useRouter()

const { t } = useI18n()

const existingPageBookmark = computed(() => store.getters.getPageBookmarkWithRoute(router.currentRoute.fullPath))

const appTitle = computed(() => store.getters.getAppTitle.replace(` - ${packageDetails.productName}`, ''))

const isBookmarkBeingCreated = computed(() => existingPageBookmark.value == null)

const pageBookmarks = computed(() => store.getters.getPageBookmarks)

const duplicateNameCount = computed(() => {
  const currentBookmarkAdjustment = name.value === existingPageBookmark.value?.name ? -1 : 0
  return currentBookmarkAdjustment + pageBookmarks.value.filter((pageBookmark) => pageBookmark.name === name.value).length
})

const title = computed(() => isBookmarkBeingCreated.value ? t('Page Bookmark.Create Bookmark') : t('Page Bookmark.Edit Bookmark'))

const pageBookmarkNameInput = ref(null)

const name = ref('')

function hide() {
  store.dispatch('hidePageBookmarkPrompt')
}

function removeBookmark() {
  const pageBookmark = existingPageBookmark.value
  store.dispatch('removePageBookmark', pageBookmark._id)
  showToast(t('Page Bookmark.Removed page bookmark', { name: pageBookmark.name }))
  hide()
}

function save() {
  if (name.value === '') {
    return
  }

  const pageBookmark = {
    route: router.currentRoute.fullPath,
    name: name.value,
    isBookmark: true
  }

  if (isBookmarkBeingCreated.value) {
    store.dispatch('createPageBookmark', pageBookmark)
    showToast(t('Page Bookmark.Created page bookmark', { name: name.value }))
  } else if (pageBookmark.name !== existingPageBookmark.value.name) {
    store.dispatch('updatePageBookmark', pageBookmark)
    showToast(t('Page Bookmark.Updated page bookmark', { name: name.value }))
  }

  hide()
}

function handleNameChange(input) {
  name.value = input
}

onMounted(() => {
  nextTick(() => {
    name.value = existingPageBookmark.value?.name ?? appTitle.value
    pageBookmarkNameInput.value?.focus()
  })
})
</script>

<style scoped src="./PageBookmarkPrompt.css" />
