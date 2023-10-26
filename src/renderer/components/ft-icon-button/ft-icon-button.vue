<template>
  <div
    ref="iconButton"
    class="ftIconButton"
    @focusout="handleDropdownFocusOut"
  >
    <font-awesome-icon
      v-if="!hideIcon && !useFtButton"
      :id="id"
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
    <ft-button
      v-if="useFtButton"
      :id="id"
      class="iconFtButton"
      @click="handleIconClick"
    >
      <font-awesome-icon
        :icon="!hideIcon ? icon : null"
        :class="{ [theme]: true }"
        :style="{
          fontSize: size + 'px'
        }"
      />
      <span>
        {{ title }}
      </span>
    </ft-button>
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
              @click="handleDropdownClick({url: option.value, index})"
              @keydown.enter="handleDropdownClick({url: option.value, index})"
              @keydown.space="handleDropdownClick({url: option.value, index})"
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
      >
        <slot>
          <template
            v-if="dropdownOptions[0]?.type === 'radiogroup'"
          >
            <div
              v-for="(option, radioGroupIndex) in dropdownOptions"
              :id="sanitizeForHtmlId(title + radioGroupIndex)"
              :key="radioGroupIndex"
              class="radiogroup"
              role="radiogroup"
            >
              <div
                v-for="(radio, radioButtonIndex) in option.radios"
                :id="sanitizeForHtmlId(title + radioGroupIndex + '-' + radioButtonIndex)"
                :key="radioGroupIndex + '-' + radioButtonIndex"
                :role="radio.type === 'divider' ? 'separator' : 'radio'"
                :aria-checked="radio.checked"
                :tabindex="radio.checked ? '0' : '-1'"
                :class="{
                  radioItem: radio.type !== 'divider',
                  listItemDivider: radio.type === 'divider',
                  checked: radio.checked
                }"
                @click="handleDropdownClick({url: radio.value, index: radioButtonIndex})"
                @keydown.left.right.up.down.space.prevent="handleRadioDropdownKeydown({url: radio.value, index: radioButtonIndex, groupIndex: radioGroupIndex}, $event)"
              >
                <span class="radioOptionLabel">
                  {{ radio.type === 'divider' ? '' : radio.label }}
                </span>
                <font-awesome-icon
                  v-if="radio.checked"
                  :icon="['fas', 'check']"
                  class="radioCheckedIcon"
                />
                <div
                  v-else
                  class="uncheckedFiller"
                />
              </div>
            </div>
          </template>
          <ul
            v-else-if="dropdownOptions.length > 0"
            class="list"
            role="listbox"
            :aria-expanded="dropdownShown"
          >
            <li
              v-for="(option, index) in dropdownOptions"
              :id="sanitizeForHtmlId(title + '-' + index)"
              :key="index"
              :role="option.type === 'divider' ? 'separator' : 'option'"
              aria-selected="false"
              :tabindex="option.type === 'divider' ? '-1' : '0'"
              :class="{
                listItem: option.type !== 'divider',
                listItemDivider: option.type === 'divider'
              }"
              @click="handleDropdownClick({url: option.value, index})"
              @keydown.enter="handleDropdownClick({url: option.value, index})"
              @keydown.space="handleDropdownClick({url: option.value, index})"
            >
              <span>
                {{ option.type === 'divider' ? '' : option.label }}
              </span>
            </li>
          </ul>
        </slot>
      </div>
    </template>
  </div>
</template>

<script src="./ft-icon-button.js" />
<style scoped lang="scss" src="./ft-icon-button.scss" />
