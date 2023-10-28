<template>
  <div
    class="ft-input-tags-component"
  >
    <div
      v-if="disabled"
      class="disabledMsg"
    >
      Some channels were blocked using ID and weren't processed.
      Feature is blocked while those IDs are updating
    </div>
    <ft-input
      ref="tagNameInput"
      :disabled="disabled"
      :placeholder="tagNamePlaceholder"
      :label="label"
      :show-label="true"
      :tooltip="tooltip"
      :show-action-button="showActionButton"
      :select-on-focus="true"
      :force-action-button-icon-name="['fas', 'arrow-right']"
      @click="updateTags"
    />
    <div class="ft-tag-box">
      <ul>
        <li
          v-for="tag in tagList"
          :key="tag.id"
        >
          <img
            v-if="tag.icon"
            :src="tag.icon"
            alt="icon"
            class="tag-icon"
          >
          <span>{{ (tag.preferredName) ? tag.preferredName : tag.name }}</span>
          <font-awesome-icon
            v-if="!disabled"
            :icon="['fas', 'fa-times']"
            class="removeTagButton"
            tabindex="0"
            role="button"
            @click="removeTag(tag)"
            @keydown.enter.prevent="removeTag(tag)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./ft-input-tags.js" />
<style scoped src="./ft-input-tags.css" />
