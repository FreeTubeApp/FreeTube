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
      @mousedown="handleIconMouseDown"
      @keydown.enter.prevent="handleIconClick"
      @keydown.space.prevent="handleIconClick"
    />
    <ft-prompt
      v-if="useModal"
      v-show="dropdownShown"
      :autosize="true"
      :label="sanitizeForHtmlId(`iconButtonPrompt-${title}`)"
      @click="dropdownShown = false"
    >
      <slot>
        <ul
          v-if="dropdownOptions.length > 0"
          class="list"
          role="listbox"
          :aria-expanded="dropdownShown"
        >
          <li
            v-for="(option, index) in dropdownOptions"
            :id="sanitizeForHtmlId(title + '-' + index)"
            :key="index"
            role="option"
            aria-selected="false"
            tabindex="-1"
            :class="option.type === 'divider' ? 'listItemDivider' : 'listItem'"
            @click="handleDropdownClick({url: option.value, index: index}, $event)"
            @keydown.enter="handleDropdownClick({url: option.value, index: index}, $event)"
            @keydown.space="handleDropdownClick({url: option.value, index: index}, $event)"
          >
            {{ option.type === 'divider' ? '' : option.label }}
          </li>
        </ul>
      </slot>
    </ft-prompt>
    <div
      v-else
      v-show="dropdownShown"
      ref="dropdown"
      tabindex="-1"
      class="iconDropdown"
      :class="{
        left: dropdownPositionX === 'left',
        right: dropdownPositionX === 'right',
        center: dropdownPositionX === 'center',
        bottom: dropdownPositionY === 'bottom',
        top: dropdownPositionY === 'top'
      }"
      @focusout="handleDropdownFocusOut"
    >
      <slot>
        <ul
          v-if="dropdownOptions.length > 0"
          class="list"
          role="listbox"
          :aria-expanded="dropdownShown"
        >
          <li
            v-for="(option, index) in dropdownOptions"
            :id="sanitizeForHtmlId(title + '-' + index)"
            :key="index"
            role="option"
            aria-selected="false"
            tabindex="-1"
            :class="option.type === 'divider' ? 'listItemDivider' : 'listItem'"
            @click="handleDropdownClick({url: option.value, index: index}, $event)"
            @keydown.enter="handleDropdownClick({url: option.value, index: index}, $event)"
            @keydown.space="handleDropdownClick({url: option.value, index: index}, $event)"
          >
            {{ option.type === 'divider' ? '' : option.label }}
          </li>
        </ul>
      </slot>
    </div>
  </div>
</template>

<script src="./ft-icon-button.js" />
<style scoped lang="scss" src="./ft-icon-button.scss" />
