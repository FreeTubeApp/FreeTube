<template>
  <div
    class="ft-input-component"
    :class="{
      search: isSearch,
      forceTextColor: forceTextColor,
      showArrow: showArrow,
      showClearTextButton: showClearTextButton
    }"
  >
    <label
      v-if="showLabel"
      :for="id"
    >
      {{ placeholder }}
      <ft-tooltip
        v-if="tooltip !== ''"
        class="selectTooltip"
        position="bottom"
        :tooltip="tooltip"
      />
    </label>
    <font-awesome-icon
      v-if="showClearTextButton && clearTextButtonVisible"
      icon="times-circle"
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
    <input
      :id="id"
      v-model="inputData"
      :list="idDataList"
      class="ft-input"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :spellcheck="spellcheck"
      @input="e => handleInput(e.target.value)"
      @focus="handleFocus"
      @blur="handleInputBlur"
      @keydown="e => handleKeyDown(e.keyCode)"
    >
    <font-awesome-icon
      v-if="showArrow"
      icon="arrow-right"
      class="inputAction"
      @click="handleClick"
    />

    <div class="options">
      <ul
        v-if="inputData !== '' && dataList.length > 0 && searchState.showOptions"
        :id="idDataList"
        class="list"
        @mouseenter="searchState.isPointerInList = true"
        @mouseleave="searchState.isPointerInList = false"
      >
        <li
          v-for="(list, index) in dataList"
          :key="index"
          :class="searchState.selectedOption == index ? 'hover': ''"
          @click="handleOptionClick(index)"
          @mouseenter="searchState.selectedOption = index"
        >
          {{ list }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./ft-input.js" />
<style scoped src="./ft-input.css" />
