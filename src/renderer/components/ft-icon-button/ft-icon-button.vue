<template>
  <div class="ftIconButton">
    <font-awesome-icon
      class="iconButton"
      :title="title"
      :icon="icon"
      :class="{
        [theme]: true,
        shadow: useShadow
      }"
      :style="{
        padding: padding + 'px',
        fontSize: size + 'px'
      }"
      tabindex="0"
      role="button"
      @click="handleIconClick"
      @keydown.enter.prevent="handleIconClick"
      @keydown.space.prevent="handleIconClick"
    />
    <div
      :id="id"
      tabindex="-1"
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
          role="listbox"
          aria-expanded="false"
        >
          <li
            v-for="(label, index) in dropdownNames"
            :id="title + '-' + index"
            :key="index"
            class="listItem"
            role="option"
            aria-selected="false"
            tabindex="-1"
            @click="handleDropdownClick(index, $event)"
            @keydown="handleDropdownClick(index, $event)"
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
