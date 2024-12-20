<template>
  <div
    class="ft-input-tags-component"
  >
    <div
      v-if="disabled"
      class="disabledMsg"
    >
      {{ disabledMsg }}
    </div>
    <ft-input
      ref="tagNameInput"
      :disabled="disabled"
      :placeholder="tagNamePlaceholder"
      :label="label"
      :min-input-length="minInputLength"
      :show-label="true"
      :tooltip="tooltip"
      :show-action-button="showActionButton"
      :select-on-focus="true"
      :force-action-button-icon-name="['fas', 'arrow-right']"
      @click="updateTags"
    />
    <div
      v-if="tagList.length >= 1"
      class="checkbox-container"
    >
      <input
        :id="sanitizedId"
        type="checkbox"
        :checked="showTags"
        @change="toggleShowTags"
      >
      <label :for="sanitizedId">
        {{ $t('Settings.Distraction Free Settings.Show Added Items') }}
      </label>
    </div>
    <div
      v-if="showTags"
      class="ft-tag-box"
    >
      <ul>
        <li
          v-for="tag in tagList"
          :key="tag.id"
        >
          <template v-if="areChannelTags">
            <router-link
              v-if="tag.icon"
              :to="tag.iconHref ?? ''"
              class="tag-icon-link"
            >
              <img
                :src="tag.icon"
                alt=""
                class="tag-icon"
                height="24"
                width="24"
                loading="lazy"
              >
            </router-link>
            <span>{{ (tag.preferredName) ? tag.preferredName : tag.name }}</span>
          </template>
          <span v-else>{{ tag }}</span>
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
