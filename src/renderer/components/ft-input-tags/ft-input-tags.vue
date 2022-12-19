<template>
  <div
    class="ft-input-tags-component"
  >
    <ft-input
      ref="childinput"
      :placeholder="placeholder"
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
          <span>{{ tag }}</span>
          <font-awesome-icon
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
