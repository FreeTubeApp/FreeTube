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
      <ul class="list">
        <li
          v-for="(label, index) in dropdownNames"
          class="listItem"
          :key="index"
          @click="handleDropdownClick(index)"
        >
          {{ label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./ft-icon-button.js" />
<style scoped lang="sass" src="./ft-icon-button.sass" />
