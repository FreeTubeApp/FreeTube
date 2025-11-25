import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { KeyboardShortcuts, PlayerIcons } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'

export class SkipButton extends shaka.ui.Element {
  /**
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   * @param {'next'|'previous'} type
   */
  constructor(events, parent, controls, type = 'next') {
    super(parent, controls)

    this.type_ = type

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add(`skip-${type}-button`, 'shaka-tooltip', 'ft-shaka-skip-button')

    /** @private */
    const icon = type === 'next' ? PlayerIcons.SKIP_NEXT_FILLED : PlayerIcons.SKIP_PREVIOUS_FILLED
    this.icon_ = new shaka.ui.MaterialSVGIcon(this.button_, icon)

    const label = document.createElement('label')
    label.classList.add(
      'shaka-overflow-button-label',
      'shaka-overflow-menu-only',
      'shaka-simple-overflow-button-label-inline'
    )

    /** @private */
    this.nameSpan_ = document.createElement('span')
    label.appendChild(this.nameSpan_)
    this.button_.appendChild(label)
    this.parent.appendChild(this.button_)

    // listener

    this.eventManager.listen(this.button_, 'click', () => {
      const eventName = type === 'next' ? 'nextVideo' : 'previousVideo'
      events.dispatchEvent(new CustomEvent(eventName))
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    const labelText =
      this.type_ === 'next'
        ? i18n.global.t('Video.Next')
        : i18n.global.t('Video.Previous')

    const shortcut =
      this.type_ === 'next'
        ? KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.SKIP_TO_NEXT
        : KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK.SKIP_TO_PREV

    const label = addKeyboardShortcutToActionTitle(labelText, shortcut)
    this.nameSpan_.textContent = this.button_.ariaLabel = label
  }
}
