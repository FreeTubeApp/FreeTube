<template>
  <ft-prompt
    :title="title"
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
        :value="bookmarkName"
        :show-clear-text-button="true"
        :show-action-button="false"
        @input="e => bookmarkName = e"
        @clear="e => bookmarkName = ''"
        @keydown.enter.native="save"
      />
    </div>
    <div class="actions-container">
      <ft-flex-box>
        <ft-button
          :label="cancelLabel"
          @click="cancelAction"
        />
        <ft-button
          :label="$t('Save')"
          :disabled="bookmarkName === ''"
          @click="save"
        />
      </ft-flex-box>
    </div>
  </ft-prompt>
</template>

<script src="./page-bookmark-prompt.js" />
<style scoped src="./page-bookmark-prompt.css" />
