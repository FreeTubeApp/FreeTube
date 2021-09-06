<template>
  <div class="dropdown">
    <div
      :id="$unspace(title)"
      class="buttonTitle"
      tabindex="0"
      role="listbox"
      @keydown="handleIconKeyPress($event)"
    >
      {{ title }}
      <font-awesome-icon
        class="angleDownIcon"
        icon="angle-down"
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
