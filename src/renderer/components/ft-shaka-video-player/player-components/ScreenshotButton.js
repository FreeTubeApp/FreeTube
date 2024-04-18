import shaka from 'shaka-player'
import { icon as faIcon } from '@fortawesome/fontawesome-svg-core'

import i18n from '../../../i18n'

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

    const icon = faIcon({ prefix: 'fas', iconName: 'camera' }).node[0]
    icon.classList.add('player-icon')
    icon.classList.add('screenshot-button-icon')

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
    this.nameSpan_.textContent = i18n.t('Video.Player.Take Screenshot')

    this.button_.ariaLabel = i18n.t('Video.Player.Take Screenshot')
  }
}
