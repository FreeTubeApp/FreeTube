<template>
  <div class="dropdown">
    <div
      :id="sanitizeForHtmlId(title)"
      class="buttonTitle"
      tabindex="0"
      role="listbox"
      @keydown.space.prevent="handleIconKeyPress($event)"
      @keydown.enter.prevent="handleIconKeyPress($event)"
      @keydown.down.prevent="handleIconKeyPress($event)"
    >
      {{ title }}
      <font-awesome-icon
        class="angleDownIcon"
        :icon="['fas', 'angle-down']"
      />
    </div>
    <ul>
      <li
        v-for="(label, index) in labelNames"
        :id="'buttonOption' + index"
        :key="index"
        class="buttonOption"
        role="option"
        tabindex="-1"
        aria-selected="false"
        @click="handleDropdownClick(index, $event)"
        @keydown="handleDropdownClick(index, $event)"
      >
        {{ label }}
      </li>
    </ul>
  </div>
</template>

<script src="./ft-list-dropdown.js" />
<style scoped src="./ft-list-dropdown.css" />
