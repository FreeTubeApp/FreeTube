<template>
  <portal to="promptPortal">
    <div
      class="prompt"
      tabindex="-1"
      :inert="inert"
      @click.self="hide"
      @keydown.enter.self="hide"
      @keydown.left.right.capture="handleArrowKeys"
    >
      <FtCard
        ref="promptCard"
        class="promptCard"
        :class="{ autosize, [theme]: true }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="id"
      >
        <slot
          name="label"
          :label-id="id"
        >
          <h2
            :id="id"
            class="center"
          >
            {{ label }}
          </h2>
        </slot>

        <slot>
          <p
            v-for="extraLabel in extraLabels"
            :key="extraLabel"
            class="center"
          >
            <strong>
              {{ extraLabel }}
            </strong>
          </p>
          <FtFlexBox>
            <FtButton
              v-for="(option, index) in optionNames"
              :key="index"
              :label="option"
              :text-color="optionButtonTextColor(index)"
              :background-color="optionButtonBackgroundColor(index)"
              :icon="index === 0 && isFirstOptionDestructive ? ['fas', 'trash'] : null"
              @click="click(optionValues[index])"
            />
          </FtFlexBox>
        </slot>
      </FtCard>
    </div>
  </portal>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useId } from '../../composables/use-id-polyfill'

import store from '../../store/index'

import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../FtButton/FtButton.vue'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  extraLabels: {
    type: Array,
    default: () => []
  },
  optionNames: {
    type: Array,
    default: () => []
  },
  optionValues: {
    type: Array,
    default: () => []
  },
  autosize: {
    type: Boolean,
    default: false
  },
  isFirstOptionDestructive: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'base'
  },
  inert: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const id = useId()

const promptCard = ref(null)

let promptButtons = []
let lastActiveElement = null

onMounted(() => {
  lastActiveElement = document.activeElement
  document.addEventListener('keydown', handleEscape, true)

  nextTick(() => {
    promptButtons = Array.from(promptCard.value.$el.querySelectorAll('.btn.ripple, .iconButton'))
    focusItem(0)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape, true)
  nextTick(() => lastActiveElement?.focus())
})

/**
 * @param {number} index
 */
function optionButtonTextColor(index) {
  if (index === 0 && props.isFirstOptionDestructive) {
    return 'var(--destructive-text-color)'
  } else if (index < props.optionNames.length - 1) {
    return 'var(--text-with-accent-color)'
  } else {
    return null
  }
}

/**
 * @param {number} index
 */
function optionButtonBackgroundColor(index) {
  if (index === 0 && props.isFirstOptionDestructive) {
    return 'var(--destructive-color)'
  } else if (index < props.optionNames.length - 1) {
    return 'var(--accent-color)'
  } else {
    return null
  }
}

/**
 * @param {any} value
 */
function click(value) {
  emit('click', value)
}

function hide() {
  click(null)
}

/**
 * @param {number} index
 */
function focusItem(index) {
  if (index < 0) {
    index = promptButtons.length - 1
  } else if (index >= promptButtons.length) {
    index = 0
  }

  promptButtons[index].focus()
  store.dispatch('showOutlines')
}

/**
 * @param {KeyboardEvent} event
 */
function handleEscape(event) {
  if (event.key === 'Escape' && !props.inert) {
    event.preventDefault()
    hide()
  }
}

/**
 * @param {KeyboardEvent} event
 */
function handleArrowKeys(event) {
  const currentIndex = promptButtons.indexOf(event.target)

  // Only react if a button was focused when the arrow key was pressed
  if (currentIndex === -1) {
    return
  }

  event.preventDefault()

  const direction = (event.key === 'ArrowLeft') ? -1 : 1
  focusItem(currentIndex + direction)
}
</script>

<style scoped src="./FtPrompt.css" />
