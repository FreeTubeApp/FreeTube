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
        <ul
          v-if="dropdownNames.length > 0"
          class="list"
        >
          <li
            v-for="(label, index) in dropdownNames"
            :key="index"
            class="listItem"
            @click="handleDropdownClick(index)"
          >
            {{ label }}
          </li>
        </ul>
      </slot>
    </div>
  </div>
</template>

<script src="./ft-icon-button.js" />
<style scoped lang="sass" src="./ft-icon-button.sass" />
