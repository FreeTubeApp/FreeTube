/**
 * @typedef {{ top: number, bottom: number }} VerticalBounds
 * @typedef {VerticalBounds & { left: number, right: number }} Bounds
 */

/**
 * @param {Bounds} bounds
 * @param {number} x
 * @param {number} y
 * @returns {Bounds}
 */
export function translateBounds(bounds, x, y) {
  return { left: bounds.left + x, right: bounds.right + x, top: bounds.top + y, bottom: bounds.bottom + y }
}

/**
 * @param {Bounds} first
 * @param {Bounds} second
 * @returns {boolean}
 */
export function boundsOverlap(first, second) {
  return first.left < second.right && first.right > second.left &&
    first.top < second.bottom && first.bottom > second.top
}

/**
 * @param {VerticalBounds} dragged
 * @param {VerticalBounds} container
 * @param {number} pointerY
 * @param {number} viewportHeight
 * @param {{ edgeRatio: number, viewportEdgeSize: number, slowSpeed: number, fastSpeed: number }} options
 * @returns {number}
 */
export function getVerticalScrollSpeed(dragged, container, pointerY, viewportHeight, { edgeRatio, viewportEdgeSize, slowSpeed, fastSpeed }) {
  const topGap = dragged.top - container.top
  const bottomGap = container.bottom - dragged.bottom
  const edgeZone = (container.bottom - container.top) * edgeRatio

  if (Math.min(topGap, bottomGap) >= edgeZone) { return 0 }

  const midpoint = (dragged.top + dragged.bottom) / 2
  if (topGap < bottomGap) {
    return midpoint <= container.top || pointerY <= viewportEdgeSize ? -fastSpeed : -slowSpeed
  }

  return midpoint >= container.bottom || pointerY >= viewportHeight - viewportEdgeSize ? fastSpeed : slowSpeed
}

/**
 * @param {VerticalBounds} dragged
 * @param {VerticalBounds} target
 * @param {1 | -1} direction
 * @returns {boolean}
 */
export function hasCrossedVerticalMidpoint(dragged, target, direction) {
  const midpoint = (target.top + target.bottom) / 2
  return direction > 0 ? dragged.bottom >= midpoint : dragged.top <= midpoint
}
