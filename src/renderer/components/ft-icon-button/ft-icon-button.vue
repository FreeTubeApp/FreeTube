<template>
  <div
    ref="ftIconButton"
    class="ftIconButton"
    @focusout="handleDropdownFocusOut"
  >
    <font-awesome-icon
      class="iconButton"
      :title="title"
      :icon="icon"
      :class="{
        [theme]: true,
        shadow: useShadow,
        pressed: openOnRightOrLongClick && dropdownShown,
        disabled
      }"
      :style="{
        padding: padding + 'px',
        fontSize: size + 'px'
      }"
      tabindex="0"
      role="button"
      :aria-disabled="disabled"
      :aria-expanded="dropdownShown"
      @pointerdown="handleIconPointerDown"
      @contextmenu.prevent=""
      @click="handleIconClick"
      @keydown.enter.prevent="handleIconClick"
      @keydown.space.prevent="handleIconClick"
    />
    <template
      v-if="dropdownShown"
    >
      <ft-prompt
        v-if="useModal"
        :autosize="true"
        :label="title"
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
              :aria-selected="option.active"
              tabindex="-1"
              :class="{
                listItemDivider: option.type === 'divider',
                listItem: option.type !== 'divider',
                active: option.active
              }"
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
        @keydown.esc.stop="handleDropdownEscape"
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
              :aria-selected="option.active"
              :tabindex="option.type === 'divider' ? '-1' : '0'"
              :class="{
                listItemDivider: option.type === 'divider',
                listItem: option.type !== 'divider',
                active: option.active
              }"
              @click="handleDropdownClick({url: option.value, index: index}, $event)"
              @keydown.enter="handleDropdownClick({url: option.value, index: index}, $event)"
              @keydown.space="handleDropdownClick({url: option.value, index: index}, $event)"
            >
              <div class="checkmarkColumn">
                <font-awesome-icon
                  v-if="option.active"
                  :icon="['fas', 'check']"
                />
              </div>
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
