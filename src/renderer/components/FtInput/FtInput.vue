<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="ft-input-component"
    :class="{
      search: isSearch,
      forceTextColor,
      showActionButton,
      showClearTextButton,
      clearTextButtonVisible: inputDataPresent || showOptions,
      inputDataPresent,
      showOptions
    }"
  >
    <label
      v-if="showLabel"
      :for="id"
      class="selectLabel"
      :class="{ disabled }"
    >
      {{ label || placeholder }}
      <FtTooltip
        v-if="tooltip !== ''"
        class="selectTooltip"
        position="bottom"
        :tooltip="tooltip"
      />
    </label>
    <button
      v-if="showClearTextButton"
      class="clearInputTextButton"
      :class="{
        visible: inputDataPresent || showOptions
      }"
      :aria-label="t('Search Bar.Clear Input')"
      :title="t('Search Bar.Clear Input')"
      @click="handleClearTextClick"
    >
      <FontAwesomeIcon
        class="buttonIcon"
        :icon="['fas', 'times-circle']"
      />
    </button>
    <span class="inputWrapper">
      <input
        :id="id"
        ref="inputRef"
        :value="inputDataDisplayed"
        class="ft-input"
        :class="{ disabled }"
        :maxlength="maxlength"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :spellcheck="false"
        :aria-label="showLabel ? null : placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleInputBlur"
        @keydown="handleKeyDown"
      >
      <button
        v-if="showActionButton"
        class="inputAction"
        :class="{
          enabled: inputDataPresent,
          withLabel: showLabel
        }"
        @click="handleClick"
      >
        <FontAwesomeIcon
          class="buttonIcon"
          :icon="actionButtonIconName"
        />
      </button>
    </span>
    <div class="options">
      <ul
        v-if="showOptions"
        class="list"
        @mouseenter="searchState.isPointerInList = true"
        @mouseleave="searchState.isPointerInList = false"
      >
        <!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
        <li
          v-for="(entry, index) in visibleDataList"
          :key="index"
          :class="{ hover: searchState.selectedOption === index }"
          @click="handleOptionClick(index)"
          @mouseenter="searchState.selectedOption = index"
          @mouseleave="resetSelectedOption"
        >
          <div class="optionWrapper">
            <FontAwesomeIcon
              v-if="dataListProperties[index]?.iconName"
              :icon="['fas', dataListProperties[index].iconName]"
              class="searchResultIcon"
            />
            <bdi>{{ entry }}</bdi>
          </div>
          <a
            v-if="dataListProperties[index]?.isRemoveable"
            class="removeButton"
            :class="{ removeButtonSelected: removeButtonSelectedIndex === index }"
            role="button"
            :aria-label="t('Search Bar.Remove')"
            href="javascript:void(0)"
            @click.prevent.stop="handleRemoveClick(index)"
          >
            {{ t('Search Bar.Remove') }}
          </a>
        </li>
        <!-- skipped -->
      </ul>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, reactive, ref, shallowRef, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtTooltip from '../FtTooltip/FtTooltip.vue'

import store from '../../store/index'

import { isKeyboardEventKeyPrintableChar, isNullOrEmpty } from '../../helpers/strings'

const { t } = useI18n()

const props = defineProps({
  inputType: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: null
  },
  maxlength: {
    type: Number,
    default: null
  },
  value: {
    type: String,
    default: ''
  },
  showActionButton: {
    type: Boolean,
    default: true
  },
  forceActionButtonIconName: {
    type: Array,
    default: null
  },
  showClearTextButton: {
    type: Boolean,
    default: false
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  isSearch: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  dataList: {
    type: Array,
    default: () => []
  },
  dataListProperties: {
    type: Array,
    default: () => []
  },
  searchResultIconNames: {
    type: Array,
    default: null
  },
  showDataWhenEmpty: {
    type: Boolean,
    default: false
  },
  tooltip: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['clear', 'click', 'input', 'remove'])

const id = useId()

const inputRef = useTemplateRef('inputRef')

const inputData = ref(props.value)
const searchState = reactive({
  showOptions: false,
  selectedOption: -1,
  isPointerInList: false,
  keyboardSelectedOptionIndex: -1
})
const visibleDataList = ref(props.dataList)
const removeButtonSelectedIndex = ref(-1)
const removalMade = ref(false)
const actionButtonIconName = shallowRef(props.forceActionButtonIconName ?? ['fas', 'search'])

const showOptions = computed(() => {
  return (inputData.value !== '' || props.showDataWhenEmpty) && visibleDataList.value.length > 0 && searchState.showOptions
})

const forceTextColor = computed(() => props.isSearch && store.getters.getBarColor)

const searchStateKeyboardSelectedOptionValue = computed(() => {
  return searchState.keyboardSelectedOptionIndex === -1
    ? null
    : visibleDataList.value[searchState.keyboardSelectedOptionIndex]
})

const inputDataDisplayed = computed(() => {
  if (!props.isSearch) { return inputData.value }

  /** @type {string | null | undefined} */
  const selectedOptionValue = searchStateKeyboardSelectedOptionValue.value
  if (selectedOptionValue != null && selectedOptionValue !== '') {
    return selectedOptionValue
  }

  return inputData.value
})

const inputDataPresent = computed(() => inputDataDisplayed.value.length > 0)

watch(() => props.dataList, updateVisibleDataList, { deep: true })
watch(inputData, updateVisibleDataList)
watch(() => props.value, (value) => {
  inputData.value = value
})

updateVisibleDataList()

/**
 * @param {KeyboardEvent | MouseEvent} [event]
 */
function handleClick(event) {
  const selectedValue = searchStateKeyboardSelectedOptionValue.value
  const query = (selectedValue != null && selectedValue !== '') ? selectedValue : inputData.value
  inputData.value = query

  // No action if no input text
  if (!inputDataPresent.value) {
    return
  }

  searchState.showOptions = false
  searchState.selectedOption = -1
  searchState.keyboardSelectedOptionIndex = -1
  removeButtonSelectedIndex.value = -1

  emit('input', query)
  emit('click', query, { event })
}

/**
 * @param {string | InputEvent} data
 */
function handleInput(data) {
  const text = typeof data === 'string' ? data : inputRef.value.value
  inputData.value = text

  if (
    props.isSearch &&
    searchState.selectedOption !== -1 &&
    inputData.value === visibleDataList.value[searchState.selectedOption]
  ) {
    return
  }

  handleActionIconChange()
  emit('input', text)
}

function handleClearTextClick() {
  // No action if no input text
  if (!inputDataPresent.value) { return }

  inputData.value = ''
  handleActionIconChange()
  updateVisibleDataList()
  searchState.isPointerInList = false

  inputRef.value.value = ''

  // Focus on input element after text is clear for better UX
  inputRef.value.focus()

  emit('clear')
}

async function handleActionIconChange() {
  // Only need to update icon if visible
  if (!props.showActionButton) { return }

  if (!inputDataPresent.value && props.forceActionButtonIconName === null) {
    // Change back to default icon if text is blank
    actionButtonIconName.value = ['fas', 'search']
    return
  }

  // Update action button icon according to input
  try {
    const result = await store.dispatch('getYoutubeUrlInfo', inputData.value)

    let isYoutubeLink = false

    switch (result.urlType) {
      case 'video':
      case 'playlist':
      case 'search':
      case 'channel':
      case 'hashtag':
      case 'post':
      case 'trending':
      case 'subscriptions':
      case 'history':
      case 'userplaylists':
        isYoutubeLink = true
        break

      case 'invalid_url':
      default: {
        // isYoutubeLink is already `false`
      }
    }

    if (props.forceActionButtonIconName === null) {
      if (isYoutubeLink) {
        // Go to URL (i.e. Video/Playlist/Channel
        actionButtonIconName.value = ['fas', 'arrow-right']
      } else {
        // Search with text
        actionButtonIconName.value = ['fas', 'search']
      }
    }
  } catch (ex) {
    // On exception, consider text as invalid URL
    if (props.forceActionButtonIconName === null) {
      actionButtonIconName.value = ['fas', 'search']
    }

    // Rethrow exception
    throw ex
  }
}

/**
 * @param {number} index
 */
function handleOptionClick(index) {
  if (removeButtonSelectedIndex.value !== -1) {
    handleRemoveClick(index)
    return
  }

  searchState.showOptions = false
  inputData.value = visibleDataList.value[index]
  emit('input', inputData.value)
  handleClick()
}

function resetSelectedOption() {
  searchState.selectedOption = -1
  removeButtonSelectedIndex.value = -1
}

/**
 * @param {number} index
 */
function handleRemoveClick(index) {
  if (!props.dataListProperties[index]?.isRemoveable) { return }

  // keep input in focus even when the to-be-removed "Remove" button was clicked
  inputRef.value.focus()
  removalMade.value = true
  emit('remove', visibleDataList.value[index])
}

/**
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
// Update Input box value if enter key was pressed and option selected
  if (event.key === 'Enter' && !event.isComposing) {
    if (removeButtonSelectedIndex.value !== -1) {
      handleRemoveClick(removeButtonSelectedIndex.value)
    } else if (searchState.selectedOption !== -1) {
      searchState.showOptions = false
      event.preventDefault()
      inputData.value = visibleDataList.value[searchState.selectedOption]
      handleOptionClick(searchState.selectedOption)
    } else {
      handleClick(event)
    }

    return
  }

  if (visibleDataList.value.length === 0) { return }

  searchState.showOptions = true

  // "select" the Remove button through right arrow navigation, and unselect it with the left arrow
  if (event.key === 'ArrowRight') {
    removeButtonSelectedIndex.value = searchState.selectedOption
  } else if (event.key === 'ArrowLeft') {
    removeButtonSelectedIndex.value = -1
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    const newIndex = searchState.selectedOption + (event.key === 'ArrowDown' ? 1 : -1)
    updateSelectedOptionIndex(newIndex)
  } else {
    const selectedOptionValue = searchStateKeyboardSelectedOptionValue.value

    // Keyboard selected & is char
    if (!isNullOrEmpty(selectedOptionValue) && isKeyboardEventKeyPrintableChar(event.key)) {
      // Update input based on KB selected suggestion value instead of current input value
      event.preventDefault()
      handleInput(`${selectedOptionValue}${event.key}`)
    }
  }
}

/**
 * Updates the selected dropdown option index and handles the under/over-flow behavior
 * @param {number} index
 */
function updateSelectedOptionIndex(index) {
  searchState.selectedOption = index

  // unset selection of "Remove" button
  removeButtonSelectedIndex.value = -1

  // Allow deselecting suggestion
  if (searchState.selectedOption < -1) {
    searchState.selectedOption = visibleDataList.value.length - 1
  } else if (searchState.selectedOption > visibleDataList.value.length - 1) {
    searchState.selectedOption = -1
  }

  // Update displayed value
  searchState.keyboardSelectedOptionIndex = searchState.selectedOption
}

function handleInputBlur() {
  if (!searchState.isPointerInList) {
    searchState.showOptions = false
  }
}

function handleFocus() {
  searchState.showOptions = true
}

function updateVisibleDataList() {
  // Reset selected option before it's updated
  // Block resetting if it was just the "Remove" button that was pressed
  if (!removalMade.value || searchState.selectedOption >= props.dataList.length) {
    searchState.selectedOption = -1
    searchState.keyboardSelectedOptionIndex = -1
    removeButtonSelectedIndex.value = -1
  }

  removalMade.value = false

  if (inputData.value.trim() === '') {
    visibleDataList.value = props.dataList
    return
  }
  // get list of items that match input
  const lowerCaseInputData = inputData.value.toLowerCase()

  visibleDataList.value = props.dataList.filter(x => {
    return x.toLowerCase().includes(lowerCaseInputData)
  })
}

defineExpose({
  focus: () => {
    inputRef.value?.focus()
  },
  blur: () => {
    inputRef.value?.blur()
  },
  select: () => {
    inputRef.value?.select()
  },

  /**
   * @param {string} text
   */
  setText: (text) => {
    inputData.value = text
  },

  clear: () => {
    handleClearTextClick()
  }
})
</script>

<style scoped src="./FtInput.css" />
