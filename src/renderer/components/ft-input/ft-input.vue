<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="ft-input-component"
    :class="{
      search: isSearch,
      forceTextColor: forceTextColor,
      showActionButton: showActionButton,
      showClearTextButton: showClearTextButton,
      clearTextButtonVisible: inputDataPresent || showOptions,
      inputDataPresent: inputDataPresent,
      showOptions: showOptions,
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
        visible: inputDataPresent || showOptions
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
        class="ft-input"
        :maxlength="maxlength"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :spellcheck="false"
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
        v-if="showOptions"
        class="list"
        @mouseenter="searchState.isPointerInList = true"
        @mouseleave="searchState.isPointerInList = false"
      >
        <!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
        <li
          v-for="(entry, index) in visibleDataList"
          :key="index"
          :class="{ hover: searchState.selectedOption === index }"
          @click="handleOptionClick(index)"
          @mouseenter="searchState.selectedOption = index"
          @mouseleave="searchState.selectedOption = -1; removeButtonSelectedIndex = -1"
        >
          <div class="optionWrapper">
            <font-awesome-icon
              v-if="dataListProperties[index]?.iconName"
              :icon="['fas', dataListProperties[index].iconName]"
              class="searchResultIcon"
            />
            <span>{{ entry }}</span>
          </div>
          <a
            v-if="dataListProperties[index]?.isRemoveable"
            class="removeButton"
            :class="{ removeButtonSelected: removeButtonSelectedIndex === index}"
            role="button"
            :aria-label="$t('Search Bar.Remove')"
            href="javascript:void(0)"
            @click.prevent.stop="handleRemoveClick(index)"
          >
            {{ $t('Search Bar.Remove') }}
          </a>
        </li>
        <!-- skipped -->
      </ul>
    </div>
  </div>
</template>

<script src="./ft-input.js" />
<style scoped src="./ft-input.css" />
