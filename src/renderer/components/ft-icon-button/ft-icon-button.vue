<template>
  <div class="ftIconButton">
    <font-awesome-icon
      class="iconButton"
      :title="title"
      :icon="icon"
      :class="{
        base: theme === 'base',
        primary: theme === 'primary',
        secondary: theme === 'secondary',
        shadow: useShadow
      }"
      @click="handleIconClick"
    />
    <div
      v-if="dropdownNames.length > 0 && showDropdown"
      class="iconDropdown"
      :class="{
        left: dropdownPosition === 'left',
        right: dropdownPosition === 'right',
        center: dropdownPosition === 'center'
      }"
    >
      <p
        v-for="(label, index) in dropdownNames"
        :key="index"
        @click="handleDropdownClick(index)"
      >
        {{ label }}
      </p>
    </div>
  </div>
</template>

<script src="./ft-icon-button.js" />
<style scoped src="./ft-icon-button.css" />
