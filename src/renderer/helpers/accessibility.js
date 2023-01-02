export function handleDropdownKeyboardEvent(event, target, afterElement) {
  if (!event || !(event instanceof KeyboardEvent)) {
    return true
  }

  let nextElement = null
  if (event.key === 'Tab') {
    if (afterElement) {
      afterElement.tabindex = 0
      afterElement.focus()
    }
    return false
  } if (event.key === 'ArrowUp') {
    nextElement = target.previousElementSibling ?? target.parentNode.lastElementChild

    if (nextElement.classList.contains('listItemDivider')) {
      nextElement = nextElement.previousElementSibling
    }
  } else if (event.key === 'ArrowDown') {
    nextElement = target.nextElementSibling ?? target.parentNode.firstElementChild

    if (nextElement.classList.contains('listItemDivider')) {
      nextElement = nextElement.nextElementSibling
    }
  } else if (event.key === 'Home') {
    nextElement = target.parentNode.firstElementChild
  } else if (event.key === 'End') {
    nextElement = target.parentNode.lastElementChild
  }

  event.preventDefault()

  if (nextElement) {
    target.setAttribute('tabindex', '-1')
    nextElement.setAttribute('tabindex', '0')
    nextElement.focus()
  }

  return event.key === 'Enter' || event.key === ' '
}

export function sanitizeForHtmlId(attribute) {
  return attribute.replaceAll(/\s+/g, '')
}
