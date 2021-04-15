<template>
  <div
    class="ft-input-component"
    :class="{
      search: isSearch,
      forceTextColor: forceTextColor
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
    <input
      :id="id"
      v-model="inputData"
      :list="idDataList"
      class="ft-input"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
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
