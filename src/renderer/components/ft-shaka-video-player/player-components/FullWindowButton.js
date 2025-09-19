import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { KeyboardShortcuts, PlayerIcons } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'

export class FullWindowButton extends shaka.ui.Element {
  /**
   * @param {boolean} fullWindowEnabled
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(fullWindowEnabled, events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('full-window-button', 'shaka-tooltip')

    /** @private */
    this.icon_ = new shaka.ui.MaterialSVGIcon(this.button_, PlayerIcons.OPEN_IN_FULL_FILLED)

    const label = document.createElement('label')
    label.classList.add(
      'shaka-overflow-button-label',
      'shaka-overflow-menu-only',
      'shaka-simple-overflow-button-label-inline'
    )

    /** @private */
    this.nameSpan_ = document.createElement('span')
    label.appendChild(this.nameSpan_)

    /** @private */
    this.currentState_ = document.createElement('span')
    this.currentState_.classList.add('shaka-current-selection-span')
    label.appendChild(this.currentState_)

    this.button_.appendChild(label)

    this.parent.appendChild(this.button_)

    /** @private */
    this.fullWindowEnabled_ = fullWindowEnabled

    // listeners

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('setFullWindow', {
        detail: !this.fullWindowEnabled_
      }))
    })

    this.eventManager.listen(events, 'setFullWindow', (/** @type {CustomEvent} */ event) => {
      this.fullWindowEnabled_ = event.detail

      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    this.icon_.use(this.fullWindowEnabled_ ? PlayerIcons.CLOSE_FULLSCREEN_FILLED : PlayerIcons.OPEN_IN_FULL_FILLED)
    this.currentState_.textContent = this.localization.resolve(this.fullWindowEnabled_ ? 'ON' : 'OFF')

    const baseAriaLabel = this.fullWindowEnabled_ ? i18n.t('Video.Player.Exit Full Window') : i18n.t('Video.Player.Full Window')
    const newLabel = addKeyboardShortcutToActionTitle(
      baseAriaLabel,
      KeyboardShortcuts.VIDEO_PLAYER.GENERAL.FULLWINDOW
    )
    this.nameSpan_.textContent = this.button_.ariaLabel = newLabel
  }
}
