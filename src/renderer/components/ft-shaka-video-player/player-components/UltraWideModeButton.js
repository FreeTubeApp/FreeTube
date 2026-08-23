import shaka from 'shaka-player'

import { KeyboardShortcuts, PlayerIcons } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'
import i18n from '../../../i18n/index'

export class UltraWideModeButton extends shaka.ui.Element {
  /**
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('ultrawide-mode-button', 'shaka-tooltip')

    /** @private */
    this.icon_ = new shaka.ui.Icon(
      this.button_,
      PlayerIcons.ULTRAWIDE_MODE_DEFAULT,
    )

    const label = document.createElement('label')
    label.classList.add(
      'shaka-overflow-button-label',
      'shaka-overflow-menu-only',
      'shaka-simple-overflow-button-label-inline',
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
    this.ultrawideEnabled_ = false

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('toggleUltrawideMode'))
    })

    this.eventManager.listen(
      events,
      'setUltrawideMode',
      (/** @type {CustomEvent} */ event) => {
        this.ultrawideEnabled_ = event.detail
        this.updateLocalisedStrings_()
      },
    )

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    this.icon_.use(
      this.ultrawideEnabled_
        ? PlayerIcons.ULTRAWIDE_MODE_FILLED
        : PlayerIcons.ULTRAWIDE_MODE_DEFAULT,
    )

    this.currentState_.textContent = this.localization.resolve(
      this.ultrawideEnabled_ ? 'ON' : 'OFF',
    )

    const baseAriaLabel = this.ultrawideEnabled_
      ? i18n.global.t('Video.Player.Exit Ultrawide Mode')
      : i18n.global.t('Video.Player.Ultrawide Mode')

    this.nameSpan_.textContent = this.button_.ariaLabel =
      addKeyboardShortcutToActionTitle(
        baseAriaLabel,
        KeyboardShortcuts.VIDEO_PLAYER.GENERAL.ULTRAWIDE_MODE,
      )
  }
}
