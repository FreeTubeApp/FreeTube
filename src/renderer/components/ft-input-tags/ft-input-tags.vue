<template>
  <div
    class="ft-input-tags-component"
  >
    <ft-input
      ref="tagNameInput"
      :placeholder="tagNamePlaceholder"
      :label="label"
      :show-label="true"
      :tooltip="tooltip"
      :show-action-button="showActionButton"
      :select-on-focus="true"
      :force-action-button-icon-name="['fas', 'arrow-right']"
      @click="updateTags"
    />
    <ft-input
      v-if="includeTagDesc"
      ref="tagDescInput"
      :placeholder="tagDescPlaceholder"
      :show-action-button="false"
    />
    <div class="ft-tag-box">
      <ul>
        <li
          v-for="tag in tagList"
          :key="tag.id"
        >
          <span>{{ tag.name }}</span>
          <span v-if="tag.secondaryName">({{ tag.secondaryName }})</span>
          <ft-tooltip
            v-if="tag.description !== ''"
            position="bottom-left"
            :tooltip="tag.description"
          />
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
