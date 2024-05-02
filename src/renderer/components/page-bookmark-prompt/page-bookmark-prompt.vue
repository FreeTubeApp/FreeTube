<template>
  <ft-prompt
    :label="title"
    @click="hide"
  >
    <h2 class="heading">
      {{ title }}
    </h2>
    <div
      class="pageBookmarkDetails"
    >
      <ft-input
        ref="pageBookmarkNameInput"
        class="pageBookmarkNameInput"
        :placeholder="$t('Name')"
        :value="name"
        :show-clear-text-button="true"
        :show-action-button="false"
        @input="e => name = e"
        @clear="e => name = ''"
        @keydown.enter.native="save"
      />
    </div>
    <div class="actions-container">
      <ft-flex-box>
        <ft-button
          :label="$t('Save')"
          :disabled="name === ''"
          text-color="var(--text-with-accent-color)"
          background-color="var(--accent-color)"
          @click="save"
        />
        <ft-button
          v-if="isBookmarkBeingCreated"
          :label="$t('Cancel')"
          :text-color="null"
          :background-color="null"
          @click="hide"
        />
        <ft-button
          v-else
          :label="$t('Page Bookmark.Remove Bookmark')"
          :icon="['fas', 'trash']"
          text-color="var(--destructive-text-color)"
          background-color="var(--destructive-color)"
          @click="removeBookmark"
        />
      </ft-flex-box>
    </div>
  </ft-prompt>
</template>

<script src="./page-bookmark-prompt.js" />
<style scoped src="./page-bookmark-prompt.css" />
