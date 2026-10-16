<template>
  <div class="tooltip">
    <button
      ref="buttonRef"
      :aria-labelledby="id"
      class="button"
      type="button"
      @mouseenter="setHovered(true)"
      @mouseleave="setHovered(false)"
      @focus="setFocused(true)"
      @blur="setFocused(false)"
    >
      <FontAwesomeIcon :icon="['fas', 'question-circle']" />
    </button>
    <p
      :id="id"
      ref="tooltipRef"
      class="text"
      :class="[resolvedPosition, { visible }]"
      :style="tooltipStyle"
      role="tooltip"
    >
      {{ tooltip }}
    </p>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onBeforeUnmount, ref, useTemplateRef, useId } from 'vue'

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
const hovered = ref(false)
const focused = ref(false)
const visible = computed(() => hovered.value || focused.value)
const tooltipStyle = ref({ top: '0px', left: '0px' })
const resolvedPosition = ref(props.position)

function updatePosition() {
  const buttonRect = buttonRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight
  const isRtl = getComputedStyle(buttonRef.value).direction === 'rtl'

  const isBottomLeft = props.position === 'bottom-left'

  let position = props.position
  if (isBottomLeft) {
    position = 'bottom'
  } else if (isRtl && (position === 'left' || position === 'right')) {
    position = OPPOSITE_POSITIONS[position]
  }

  const room = {
    top: buttonRect.top - ANCHOR_GAP - VIEWPORT_MARGIN,
    bottom: viewportHeight - buttonRect.bottom - ANCHOR_GAP - VIEWPORT_MARGIN,
    left: buttonRect.left - ANCHOR_GAP - VIEWPORT_MARGIN,
    right: viewportWidth - buttonRect.right - ANCHOR_GAP - VIEWPORT_MARGIN,
  }

  const needed = position === 'top' || position === 'bottom' ? tooltipRect.height : tooltipRect.width

  // Flip to the opposite side only if the tooltip doesn't fit on the preferred one and the opposite side has more room
  if (room[position] < needed) {
    const oppositePlacement = OPPOSITE_POSITIONS[position]
    if (room[oppositePlacement] > room[position]) {
      position = oppositePlacement
    }
  }

  // 'bottom-left' shifts the tooltip towards the start side of the page (the right in RTL)
  const horizontalShift = isBottomLeft ? ((isRtl ? 1 : -1) * (tooltipRect.width / 2 - buttonRect.width)) : 0

  let top
  let left
  switch (position) {
    case 'top':
      top = buttonRect.top - ANCHOR_GAP - tooltipRect.height
      left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2 + horizontalShift
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
      left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2 + horizontalShift
      break
  }

  // Clamp inside the viewport
  const minTop = VIEWPORT_MARGIN
  const maxTop = viewportHeight - VIEWPORT_MARGIN - tooltipRect.height
  top = Math.max(minTop, Math.min(top, maxTop))

  const minLeft = VIEWPORT_MARGIN
  const maxLeft = viewportWidth - VIEWPORT_MARGIN - tooltipRect.width
  left = Math.max(minLeft, Math.min(left, maxLeft))

  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
  resolvedPosition.value = position
}

function setHovered(value) {
  hovered.value = value
  refresh()
}

function setFocused(value) {
  focused.value = value
  refresh()
}

function refresh() {
  if (visible.value) {
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
