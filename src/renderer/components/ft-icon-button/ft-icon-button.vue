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
      v-if="showDropdown"
      class="iconDropdown"
      :class="{
        left: dropdownPositionX === 'left',
        right: dropdownPositionX === 'right',
        center: dropdownPositionX === 'center',
        bottom: dropdownPositionY === 'bottom',
        top: dropdownPositionY === 'top'
      }"
    >
      <slot>
        <div
          v-if="dropdownNames.length > 0"
        >
          <p
            v-for="(label, index) in dropdownNames"
            :key="index"
            class="dropdownItem
            @click="handleDropdownClick(index)"
          >
            {{ label }}
          </p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script src="./ft-icon-button.js" />
<style scoped src="./ft-icon-button.css" />
