import { onBeforeUnmount, ref, shallowRef } from 'vue'

import { translateBounds, boundsOverlap, getVerticalScrollSpeed, hasCrossedVerticalMidpoint } from '../helpers/dragGeometry'

const DRAG_SCROLL = { intervalMs: 25, edgeRatio: 0.2, viewportEdgeSize: 16, slowSpeed: 120, fastSpeed: 1480 }

/**
 * @template {{ playlistItemId: string }} T
 * @param {object} options
 * @param {import('vue').Ref<T[]>} options.items
 * @param {import('vue').Ref<HTMLElement | null>} options.listRef where rows are direct children of the list container and have .playlistItem + data-index
 * @param {import('vue').Ref<HTMLElement | null>} options.contentRef
 * @param {() => DOMRect} options.getPanelBounds
 * @param {import('vue').ComputedRef<boolean>} options.canReorder
 * @param {(items: T[], item: T, position: number) => void} options.onMove position is one-based
 * @param {(dragging: boolean) => void} options.onDraggingChange
 * @returns {{
 *   draggedItem: import('vue').ShallowRef<T | null>,
 *   dragImageReady: import('vue').Ref<boolean>,
 *   dragOutside: import('vue').Ref<boolean>,
 *   startDrag: (event: DragEvent, item: T, thumbnailBounds?: DOMRect | null) => void,
 *   cancelDrag: () => void
 * }}
 */
export function usePlaylistDrag({ items, listRef, contentRef, getPanelBounds, canReorder, onMove, onDraggingChange }) {
  const draggedItem = shallowRef(null)
  const dragImageReady = ref(false)
  const dragOutside = ref(false)
  let thumbnailPointerOffsets = null
  let rowPointerOffsets = null
  let orderBeforeDrag = null
  let draggedIndex = -1
  let dragPointerY = 0
  let dragPointerInViewport = false
  let dragScrollSpeed = 0
  let dragScrollInterval = null
  let previousScrollHeight = null

  function startDrag(event, item, thumbnailBounds) {
    if (!canReorder.value) {
      event.preventDefault()
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const thumbnail = thumbnailBounds ?? bounds
    thumbnailPointerOffsets = translateBounds(thumbnail, -event.clientX, -event.clientY)
    rowPointerOffsets = translateBounds(bounds, -event.clientX, -event.clientY)
    orderBeforeDrag = items.value
    draggedIndex = items.value.indexOf(item)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.playlistItemId)
    event.dataTransfer.setDragImage(event.currentTarget, -rowPointerOffsets.left, -rowPointerOffsets.top)

    draggedItem.value = item
    dragPointerInViewport = true
    onDraggingChange(true)

    document.addEventListener('drag', updateDragScroll, true)
    // a live reorder can change the target before the next dragover
    document.addEventListener('dragenter', enterViewport, true)
    document.addEventListener('dragleave', leaveViewport, true)
    document.addEventListener('dragover', updateDragScroll, true)
    document.addEventListener('drop', dropDrag, true)
    document.addEventListener('dragend', cancelDrag, true)

    requestAnimationFrame(() => {
      if (draggedItem.value === item) { dragImageReady.value = true }
    })
  }

  function moveDraggedItem(targetIndex, bounds, pointerY) {
    const sourceIndex = draggedIndex
    if (sourceIndex === targetIndex) { return }

    const draggedBounds = translateBounds(rowPointerOffsets, 0, pointerY)
    if (!hasCrossedVerticalMidpoint(draggedBounds, bounds, sourceIndex < targetIndex ? 1 : -1)) { return }

    const reordered = items.value.slice()
    reordered.splice(targetIndex, 0, reordered.splice(sourceIndex, 1)[0])
    draggedIndex = targetIndex
    items.value = reordered
  }

  function updateDragScroll(event) {
    if (!draggedItem.value || !dragPointerInViewport) { return }

    dragPointerY = event.clientY
    const list = listRef.value
    const dragoverInsideList = event.type === 'dragover' && list.contains(event.target)
    if (event.type === 'dragover') { acceptDrop(event) }

    const bounds = list.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const visibleBounds = {
      left: bounds.left,
      right: bounds.right,
      top: Math.max(0, bounds.top),
      bottom: Math.min(viewportHeight, bounds.bottom)
    }

    const thumbnailBounds = translateBounds(thumbnailPointerOffsets, event.clientX, event.clientY)
    const draggedBounds = translateBounds(rowPointerOffsets, event.clientX, event.clientY)
    dragOutside.value = !boundsOverlap(thumbnailBounds, visibleBounds)
    dragScrollSpeed = getVerticalScrollSpeed(draggedBounds, visibleBounds, dragPointerY, viewportHeight, DRAG_SCROLL)

    if (dragScrollSpeed !== -DRAG_SCROLL.fastSpeed) { previousScrollHeight = null }

    if (!dragScrollSpeed) {
      stopDragScroll()
    } else if (dragScrollInterval === null) {
      dragScrollInterval = setInterval(scrollDuringDrag, DRAG_SCROLL.intervalMs)
    }

    if (Math.abs(dragScrollSpeed) > DRAG_SCROLL.slowSpeed) { return }

    if (dragoverInsideList && event.target instanceof Element) {
      const targetRow = event.target.closest('.playlistItem')
      if (targetRow) {
        moveDraggedItem(Number(targetRow.dataset.index), targetRow.getBoundingClientRect(), event.clientY)
      }
    }

    const pointerOutsideHorizontally = event.clientX < bounds.left || event.clientX > bounds.right
    if (pointerOutsideHorizontally && !dragoverInsideList && !dragOutside.value) {
      const source = list.children[draggedIndex].getBoundingClientRect()
      previewAdjacentDrag(Math.sign(draggedBounds.top - source.top))
    }
  }

  function scrollDuringDrag() {
    const list = listRef.value
    let offset = dragScrollSpeed * DRAG_SCROLL.intervalMs / 1000
    if (dragScrollSpeed === -DRAG_SCROLL.fastSpeed) {
      // compensate for rows expanding above the viewport as they load
      const scrollHeight = list.scrollHeight
      if (previousScrollHeight !== null) { offset += Math.max(0, scrollHeight - previousScrollHeight) }
      previousScrollHeight = scrollHeight
    }
    list.scrollTop += offset

    if (dragOutside.value || Math.abs(dragScrollSpeed) > DRAG_SCROLL.slowSpeed) { return }
    previewAdjacentDrag(Math.sign(dragScrollSpeed))
  }

  function previewAdjacentDrag(direction) {
    const targetIndex = draggedIndex + direction
    if (targetIndex >= 0 && targetIndex < items.value.length) {
      moveDraggedItem(targetIndex, listRef.value.children[targetIndex].getBoundingClientRect(), dragPointerY)
    }
  }

  function stopDragScroll() {
    clearInterval(dragScrollInterval)
    dragScrollInterval = null
    dragScrollSpeed = 0
    previousScrollHeight = null
  }

  function enterViewport(event) {
    acceptDrop(event)

    if (dragPointerInViewport) { return }

    dragPointerInViewport = true
    updateDragScroll(event)
  }

  function leaveViewport(event) {
    if (event.relatedTarget) { return }

    dragPointerInViewport = false
    stopDragScroll()
  }

  function acceptDrop(event) {
    if (!draggedItem.value || !isInsidePlaylistDropArea(event)) { return }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function dropDrag(event) {
    if (!draggedItem.value || !isInsidePlaylistDropArea(event)) { return }

    event.preventDefault()
    finishDrag()
  }

  function finishDrag() {
    const reordered = items.value
    const changed = orderBeforeDrag[draggedIndex] !== draggedItem.value
    const item = draggedItem.value
    const position = draggedIndex + 1

    endDrag()

    if (changed) {
      onMove(reordered, item, position)
    }
  }

  function cancelDrag() {
    if (!draggedItem.value) { return }

    items.value = orderBeforeDrag
    endDrag()
  }

  function isInsidePlaylistDropArea(event) {
    const list = listRef.value
    if (!list) { return false }
    if (list.contains(event.target)) { return true }

    const bounds = list.getBoundingClientRect()
    const pointerInsideList = event.clientX >= bounds.left && event.clientX <= bounds.right &&
      event.clientY >= bounds.top && event.clientY <= bounds.bottom

    if (pointerInsideList) { return true }

    if (event.clientX < bounds.left || event.clientX > bounds.right) { return false }

    const rowHeight = rowPointerOffsets.bottom - rowPointerOffsets.top
    const contentBounds = contentRef.value.getBoundingClientRect()
    const panelBounds = getPanelBounds()
    const topGap = { top: Math.max(bounds.top - rowHeight, contentBounds.top), bottom: bounds.top }
    const bottomGap = { top: bounds.bottom, bottom: Math.min(bounds.bottom + rowHeight, panelBounds.bottom) }
    const pointerInTopGap = draggedIndex === 0 && event.clientY < topGap.bottom && event.clientY >= topGap.top
    const pointerInBottomGap = draggedIndex === items.value.length - 1 && event.clientY > bottomGap.top && event.clientY <= bottomGap.bottom

    return pointerInTopGap || pointerInBottomGap
  }

  function endDrag() {
    const wasDragging = !!draggedItem.value

    document.removeEventListener('drag', updateDragScroll, true)
    document.removeEventListener('dragenter', enterViewport, true)
    document.removeEventListener('dragleave', leaveViewport, true)
    document.removeEventListener('dragover', updateDragScroll, true)
    document.removeEventListener('drop', dropDrag, true)
    document.removeEventListener('dragend', cancelDrag, true)
    stopDragScroll()

    orderBeforeDrag = null
    draggedIndex = -1
    draggedItem.value = null
    dragImageReady.value = false
    dragOutside.value = false
    thumbnailPointerOffsets = null
    rowPointerOffsets = null

    if (wasDragging) { onDraggingChange(false) }
  }

  onBeforeUnmount(cancelDrag)

  return {
    draggedItem,
    dragImageReady,
    dragOutside,
    startDrag,
    cancelDrag
  }
}
