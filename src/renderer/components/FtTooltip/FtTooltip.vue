<template>
  <div class="tooltip">
    <button
      ref="buttonRef"
      :aria-labelledby="id"
      class="button"
      type="button"
      @mouseenter="setHovered"
      @mouseleave="setHovered"
      @focus="setFocused"
      @blur="setFocused"
    >
      <FontAwesomeIcon :icon="['fas', 'question-circle']" />
    </button>
    <Teleport to=".app">
      <p
        :id="id"
        ref="tooltipRef"
        class="text"
        :class="[resolvedPosition, { visible: isVisible }]"
        :style="tooltipStyle"
        role="tooltip"
      >
        {{ tooltip }}
      </p>
    </Teleport>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onBeforeUnmount, ref, reactive, useTemplateRef, useId } from 'vue'

const props = defineProps({
  position: {
    type: String,
    default: 'bottom',
    validator: (value) => value === 'bottom' || value === 'left' || value === 'right' || value === 'top' || value === 'bottom-left'
  },
  tooltip: {
    type: String,
    required: true
  },
})

const id = useId()

const VIEWPORT_MARGIN = 8 // minimum distance (px) to the window edges
const ANCHOR_GAP = 12 // distance (px) between the button and the tooltip
const OPPOSITE_POSITIONS = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
}

const buttonRef = useTemplateRef('buttonRef')
const tooltipRef = useTemplateRef('tooltipRef')
const isHovered = ref(false)
const isFocused = ref(false)
const isBttnOutOfView = ref(false)
const tooltipStyle = reactive({ top: '0px', left: '0px' })
const resolvedPosition = ref(props.position)

/** @type {import('vue').ComputedRef<boolean>} */
const isActive = computed(() => isHovered.value || isFocused.value)

/** @type {import('vue').ComputedRef<boolean>} */
const isVisible = computed(() => isActive.value && !isBttnOutOfView.value)

function updatePosition() {
  const buttonRect = buttonRef.value.getBoundingClientRect()
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight

  isBttnOutOfView.value = buttonRect.bottom < 0 || buttonRect.top > viewportHeight || buttonRect.right < 0 || buttonRect.left > viewportWidth
  if (isBttnOutOfView.value) {
    return
  }

  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  const isRtl = getComputedStyle(buttonRef.value).direction === 'rtl'
  const isBottomLeft = props.position === 'bottom-left'

  let position = props.position
  if (isBottomLeft) {
    position = 'bottom'
  } else if (isRtl && (position === 'left' || position === 'right')) {
    position = OPPOSITE_POSITIONS[position]
  }

  const availableSpace = {
    top: buttonRect.top - ANCHOR_GAP - VIEWPORT_MARGIN,
    bottom: viewportHeight - buttonRect.bottom - ANCHOR_GAP - VIEWPORT_MARGIN,
    left: buttonRect.left - ANCHOR_GAP - VIEWPORT_MARGIN,
    right: viewportWidth - buttonRect.right - ANCHOR_GAP - VIEWPORT_MARGIN,
  }

  const requiredSpace = position === 'top' || position === 'bottom' ? tooltipRect.height : tooltipRect.width

  // Flip to the opposite side only if the tooltip doesn't fit on the preferred one and the opposite side has more room
  if (availableSpace[position] < requiredSpace) {
    const oppositePosition = OPPOSITE_POSITIONS[position]
    if (availableSpace[oppositePosition] > availableSpace[position]) {
      position = oppositePosition
    }
  }

  const horizontalOffset = isBottomLeft ? ((isRtl ? 1 : -1) * (tooltipRect.width / 2 - buttonRect.width)) : 0

  let top
  let left
  switch (position) {
    case 'top':
      top = buttonRect.top - ANCHOR_GAP - tooltipRect.height
      left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2 + horizontalOffset
      break
    case 'left':
      top = buttonRect.top + buttonRect.height / 2 - tooltipRect.height / 2
      left = buttonRect.left - ANCHOR_GAP - tooltipRect.width
      break
    case 'right':
      top = buttonRect.top + buttonRect.height / 2 - tooltipRect.height / 2
      left = buttonRect.right + ANCHOR_GAP
      break
    case 'bottom':
      top = buttonRect.bottom + ANCHOR_GAP
      left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2 + horizontalOffset
      break
  }

  // Clamp inside the viewport
  const minTop = VIEWPORT_MARGIN
  const maxTop = viewportHeight - VIEWPORT_MARGIN - tooltipRect.height
  top = Math.max(minTop, Math.min(top, maxTop))

  const minLeft = VIEWPORT_MARGIN
  const maxLeft = viewportWidth - VIEWPORT_MARGIN - tooltipRect.width
  left = Math.max(minLeft, Math.min(left, maxLeft))

  tooltipStyle.top = `${top}px`
  tooltipStyle.left = `${left}px`
  resolvedPosition.value = position
}

/**
 * @param {PointerEvent} event
 */
function setHovered(event) {
  isHovered.value = event.type === 'mouseenter'
  refresh()
}

/**
 * @param {FocusEvent} event
 */
function setFocused(event) {
  isFocused.value = event.type === 'focus'
  refresh()
}

function refresh() {
  if (isActive.value) {
    show()
  } else {
    removeListeners()
  }
}

function show() {
  updatePosition()
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
}

function removeListeners() {
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
}

onBeforeUnmount(removeListeners)
</script>

<style scoped src="./FtTooltip.css" />
