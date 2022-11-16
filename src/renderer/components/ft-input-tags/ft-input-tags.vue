<template>
  <div
    class="ft-input-tags-component"
  >
    <div
      class="input-tag-label-area"
    >
      <label
        class="ft-input-tags-label"
        @click="focusInput"
      >{{ label }}</label>
      <ft-tooltip
        v-if="tooltip !== ''"
        class="inputTagsTooltip"
        :tooltip="tooltip"
      />
    </div>

    <ft-input
      ref="childinput"
      :placeholder="placeholder"
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
          <label>{{ tag }}</label>
          <font-awesome-icon
            :icon="['fas', 'fa-times']"
            class="removeTagButton"
            tabindex="0"
            role="button"
            @click="removeTag"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./ft-input-tags.js" />
<style scoped src="./ft-input-tags.css" />
