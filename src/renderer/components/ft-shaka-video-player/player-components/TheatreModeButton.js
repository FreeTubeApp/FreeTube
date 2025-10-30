import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { KeyboardShortcuts, PlayerIcons } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'

export class TheatreModeButton extends shaka.ui.Element {
  /**
   * @param {boolean} theatreModeEnabled
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(theatreModeEnabled, events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('theatre-button', 'shaka-tooltip')

    /** @private */
    this.icon_ = new shaka.ui.MaterialSVGIcon(this.button_, PlayerIcons.RECTANGLE_DEFAULT)

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
    this.theatreModeEnabled_ = theatreModeEnabled

    // listeners

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('toggleTheatreMode', {
        detail: !this.theatreModeEnabled_
      }))
    })

    this.eventManager.listen(events, 'toggleTheatreMode', (/** @type {CustomEvent} */event) => {
      this.theatreModeEnabled_ = event.detail

      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    this.icon_.use(this.theatreModeEnabled_ ? PlayerIcons.VARIABLES_DEFAULT : PlayerIcons.RECTANGLE_DEFAULT)

    this.currentState_.textContent = this.localization.resolve(this.theatreModeEnabled_ ? 'ON' : 'OFF')

    const baseAriaLabel = this.theatreModeEnabled_ ? i18n.t('Video.Player.Exit Theatre Mode') : i18n.t('Video.Player.Theatre Mode')

    this.nameSpan_.textContent = this.button_.ariaLabel = addKeyboardShortcutToActionTitle(
      baseAriaLabel,
      KeyboardShortcuts.VIDEO_PLAYER.GENERAL.THEATRE_MODE
    )
  }
}
