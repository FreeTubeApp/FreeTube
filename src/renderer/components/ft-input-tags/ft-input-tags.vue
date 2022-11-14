<template>
  <div
    class="ft-input-tags-component"
  >
    <label
      class="ft-input-tags-title"
    >{{ title }}</label>

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
