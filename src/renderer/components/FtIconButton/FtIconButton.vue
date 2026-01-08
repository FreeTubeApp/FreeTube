<template>
  <div
    ref="ftIconButton"
    class="ftIconButton"
    @focusout="handleDropdownFocusOut"
  >
    <button
      class="iconButton"
      :aria-label="title"
      :title="title"
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
      :aria-disabled="disabled"
      :aria-expanded="dropdownShown"
      @pointerdown="handleIconPointerDown"
      @contextmenu.prevent
      @click="handleIconClick"
    >
      <FontAwesomeIcon
        class="icon"
        :icon="icon"
      />
    </button>
    <template
      v-if="dropdownShown"
    >
      <FtPrompt
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
              :id="id + '-' + index"
              :key="index"
              role="option"
              :aria-selected="option.active"
              tabindex="-1"
              :class="{
                listItemDivider: option.type === 'divider',
                listItem: option.type !== 'divider',
                active: option.active
              }"
              @click="handleDropdownClick({ url: option.value, index: index })"
              @keydown.enter="handleDropdownClick({ url: option.value, index: index })"
              @keydown.space="handleDropdownClick({ url: option.value, index: index })"
            >
              {{ option.type === 'divider' ? '' : option.label }}
            </li>
          </ul>
        </slot>
      </FtPrompt>
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
              :id="id + index"
              :key="index"
              :role="option.type === 'divider' ? 'separator' : 'option'"
              :aria-selected="option.active"
              :tabindex="option.type === 'divider' ? '-1' : '0'"
              :class="{
                listItemDivider: option.type === 'divider',
                listItem: option.type !== 'divider',
                active: option.active
              }"
              @click="handleDropdownClick({ url: option.value, index: index })"
              @keydown.enter="handleDropdownClick({ url: option.value, index: index })"
              @keydown.space="handleDropdownClick({ url: option.value, index: index })"
            >
              <div class="checkmarkColumn">
                <FontAwesomeIcon
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

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'

import FtPrompt from '../FtPrompt/FtPrompt.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  icon: {
    type: Array,
    default: () => ['fas', 'ellipsis-v']
  },
  disabled: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'base'
  },
  useShadow: {
    type: Boolean,
    default: true
  },
  padding: {
    type: Number,
    default: 10
  },
  size: {
    type: Number,
    default: 20
  },
  forceDropdown: {
    type: Boolean,
    default: false
  },
  returnIndex: {
    type: Boolean,
    default: false
  },
  dropdownPositionX: {
    type: String,
    default: 'center'
  },
  dropdownPositionY: {
    type: String,
    default: 'bottom'
  },
  dropdownOptions: {
    // Array of objects with these properties
    // - type: ('labelValue'|'divider', default to 'labelValue' for less typing)
    // - label: String (if type === 'labelValue')
    // - value: String (if type === 'labelValue')
    // - (OPTIONAL) active: Number (if type === 'labelValue')
    type: Array,
    default: () => []
  },
  dropdownModalOnMobile: {
    type: Boolean,
    default: false
  },
  openOnRightOrLongClick: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'disabled-click'])

const LONG_CLICK_BOUNDARY_MS = 500

const id = useId()

const dropdownShown = ref(false)
const useModal = ref(false)

let blockLeftClick = false
let longPressTimer = null

if (props.dropdownModalOnMobile) {
  onMounted(() => {
    useModal.value = window.innerWidth <= 900
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
}

const dropdown = useTemplateRef('dropdown')

/**
 * @param {PointerEvent | null} e
 * @param {boolean} isRightOrLongClick
 */
function handleIconClick(e, isRightOrLongClick = false) {
  if (props.disabled) {
    emit('disabled-click')
    return
  }

  if (blockLeftClick) {
    return
  }

  if (longPressTimer != null) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

  if ((!props.openOnRightOrLongClick || (props.openOnRightOrLongClick && isRightOrLongClick)) &&
    (props.forceDropdown || props.dropdownOptions.length > 0)) {
    dropdownShown.value = !dropdownShown.value
    if (dropdownShown.value && !useModal.value) {
      // wait until the dropdown is visible
      // then focus it so we can hide it automatically when it loses focus
      nextTick(() => {
        dropdown.value?.focus()
      })
    }
  } else {
    emit('click')
  }
}

/**
 * @param {PointerEvent} event
 */
function handleIconPointerDown(event) {
  if (!props.openOnRightOrLongClick) {
    return
  }

  if (event.button === 2) { // right button click
    handleIconClick(null, true)
  } else if (event.button === 0) { // left button click
    longPressTimer = setTimeout(() => {
      handleIconClick(null, true)

      // prevent a long press that ends on the icon button from firing the handleIconClick handler
      window.addEventListener('pointerup', preventButtonClickAfterLongPress, { once: true })
      window.addEventListener('pointercancel', () => {
        window.removeEventListener('pointerup', preventButtonClickAfterLongPress)
      }, { once: true })
    }, LONG_CLICK_BOUNDARY_MS)
  }
}

function preventButtonClickAfterLongPress() {
  blockLeftClick = true

  setTimeout(() => {
    blockLeftClick = false
  }, 0)
}

const ftIconButton = useTemplateRef('ftIconButton')

function handleDropdownFocusOut() {
  if (!useModal.value && dropdownShown.value && !ftIconButton.value?.matches(':focus-within')) {
    dropdownShown.value = false
  }
}

function handleDropdownEscape() {
  dropdownShown.value = false
  ftIconButton.value?.firstElementChild?.focus()
}

function handleDropdownClick({ url, index }) {
  if (props.returnIndex) {
    emit('click', index)
  } else {
    emit('click', url)
  }

  dropdownShown.value = false
}

function handleResize() {
  useModal.value = window.innerWidth <= 900
}

defineExpose({
  dropdownShown: computed(() => dropdownShown.value),

  hideDropdown: () => {
    dropdownShown.value = false
  }
})
</script>

<style scoped lang="scss" src="./FtIconButton.scss" />
