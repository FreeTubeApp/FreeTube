<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="ft-input-component"
    :class="{
      search: isSearch,
      forceTextColor: forceTextColor,
      showActionButton: showActionButton,
      showClearTextButton: showClearTextButton,
      clearTextButtonVisible: inputDataPresent,
      disabled: disabled
    }"
  >
    <label
      v-if="showLabel"
      :for="id"
      class="selectLabel"
    >
      {{ label || placeholder }}
      <ft-tooltip
        v-if="tooltip !== ''"
        class="selectTooltip"
        position="bottom"
        :tooltip="tooltip"
      />
    </label>
    <font-awesome-icon
      v-if="showClearTextButton"
      :icon="['fas', 'times-circle']"
      class="clearInputTextButton"
      :class="{
        visible: inputDataPresent
      }"
      tabindex="0"
      role="button"
      :title="$t('Search Bar.Clear Input')"
      @click="handleClearTextClick"
      @keydown.space.prevent="handleClearTextClick"
      @keydown.enter.prevent="handleClearTextClick"
    />
    <span class="inputWrapper">
      <input
        :id="id"
        ref="input"
        :value="inputDataDisplayed"
        :list="idDataList"
        class="ft-input"
        :maxlength="maxlength"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :spellcheck="spellcheck"
        :aria-label="!showLabel ? placeholder : null"
        @input="e => handleInput(e.target.value)"
        @focus="handleFocus"
        @blur="handleInputBlur"
        @keydown="handleKeyDown"
      >
      <font-awesome-icon
        v-if="showActionButton"
        :icon="actionButtonIconName"
        class="inputAction"
        :class="{
          enabled: inputDataPresent,
          withLabel: showLabel
        }"
        @click="handleClick"
      />
    </span>
    <div class="options">
      <ul
        v-if="inputData !== '' && visibleDataList.length > 0 && searchState.showOptions"
        :id="idDataList"
        class="list"
        @mouseenter="searchState.isPointerInList = true"
        @mouseleave="searchState.isPointerInList = false"
      >
        <!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
        <li
          v-for="(entry, index) in visibleDataList"
          :key="index"
          :class="{ hover: searchState.selectedOption === index }"
          :aria-roledescription="entry.isBookmark ? $t('Role Descriptions.bookmark') : null"
          @click="handleOptionClick(index)"
          @mouseenter="searchState.selectedOption = index"
          @mouseleave="searchState.selectedOption = -1"
        >
          <font-awesome-icon
            v-if="entry.isBookmark"
            :icon="iconForBookmarkedPage(entry)"
            class="searchResultIcon bookmarkStarIcon"
          />
          <font-awesome-icon
            v-else-if="isSearch"
            :icon="['fas', 'magnifying-glass']"
            class="searchResultIcon"
          />
          {{ entry.name ?? entry }}
        </li>
        <!-- skipped -->
      </ul>
    </div>
  </div>
</template>

<script src="./ft-input.js" />
<style scoped src="./ft-input.css" />
