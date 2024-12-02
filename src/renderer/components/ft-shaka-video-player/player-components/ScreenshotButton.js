import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { KeyboardShortcuts } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'

export class ScreenshotButton extends shaka.ui.Element {
  /**
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('screenshot-button')
    this.button_.classList.add('shaka-tooltip')

    const icon = document.createElement('i')
    icon.classList.add('material-icons-round')
    icon.textContent = 'photo_camera'

    this.button_.appendChild(icon)

    const label = document.createElement('label')
    label.classList.add('shaka-overflow-button-label')
    label.classList.add('shaka-overflow-menu-only')

    /** @private */
    this.nameSpan_ = document.createElement('span')
    label.appendChild(this.nameSpan_)

    this.button_.appendChild(label)

    this.parent.appendChild(this.button_)

    // listeners

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('takeScreenshot'))
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    const label = addKeyboardShortcutToActionTitle(
      i18n.t('Video.Player.Take Screenshot'),
      KeyboardShortcuts.VIDEO_PLAYER.GENERAL.TAKE_SCREENSHOT
    )
    this.nameSpan_.textContent = this.button_.ariaLabel = label
  }
}
