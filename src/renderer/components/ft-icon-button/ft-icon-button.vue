<template>
  <div class="ftIconButton">
    <span
      ref="iconButton"
      tabindex="0"
      role="button"
      :aria-expanded="dropdownShown"
      @click="handleIconClick"
      @mousedown="handleIconMouseDown"
      @keydown.enter.prevent="handleIconClick"
      @keydown.space.prevent="handleIconClick"
    >
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
      />
    </span>
    <template
      v-if="dropdownShown"
    >
      <ft-prompt
        v-if="useModal"
        :autosize="true"
        :label="sanitizeForHtmlId(`iconButtonPrompt-${title}`)"
        @click="dropdownShown = false"
      >
        <slot>
          <ul
            v-if="dropdownOptions.length > 0"
            class="list"
            role="listbox"
          >
            <li
              v-for="(option, index) in dropdownOptions"
              :id="sanitizeForHtmlId(title + '-' + index)"
              :key="index"
              role="option"
              aria-selected="false"
              tabindex="-1"
              :class="option.type === 'divider' ? 'listItemDivider' : 'listItem'"
              @click="handleDropdownClick({url: option.value, index: index})"
              @keydown.enter="handleDropdownClick({url: option.value, index: index})"
              @keydown.space="handleDropdownClick({url: option.value, index: index})"
            >
              {{ option.type === 'divider' ? '' : option.label }}
            </li>
          </ul>
        </slot>
      </ft-prompt>
      <div
        v-else
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
          >
            <li
              v-for="(option, index) in dropdownOptions"
              :id="sanitizeForHtmlId(title + '-' + index)"
              :key="index"
              :role="option.type === 'divider' ? 'separator' : 'option'"
              aria-selected="false"
              :tabindex="option.type === 'divider' ? '-1' : '0'"
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
    </template>
  </div>
</template>

<script src="./ft-icon-button.js" />
<style scoped lang="scss" src="./ft-icon-button.scss" />
