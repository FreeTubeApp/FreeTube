import shaka from 'shaka-player'
import { icon as faIcon } from '@fortawesome/fontawesome-svg-core'

import i18n from '../../../i18n'

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
    this.button_.classList.add('full-window-button')
    this.button_.classList.add('shaka-tooltip')

    /** @private */
    this.enableIcon_ = faIcon({ prefix: 'fas', iconName: 'up-right-and-down-left-from-center' }).node[0]
    this.enableIcon_.classList.add('player-icon')

    /** @private */
    this.disableIcon_ = faIcon({ prefix: 'fas', iconName: 'down-left-and-up-right-to-center' }).node[0]
    this.disableIcon_.classList.add('player-icon')

    this.button_.appendChild(this.enableIcon_)

    const label = document.createElement('label')
    label.classList.add('shaka-overflow-button-label')
    label.classList.add('shaka-overflow-menu-only')

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
        detail: {
          enabled: !this.fullWindowEnabled_
        }
      }))
    })

    this.eventManager.listen(events, 'setFullWindow', (/** @type {CustomEvent} */ event) => {
      this.fullWindowEnabled_ = event.detail.enabled

      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    this.nameSpan_.textContent = i18n.t('Video.Player.Full Window')

    this.button_.firstChild.replaceWith(this.fullWindowEnabled_ ? this.disableIcon_ : this.enableIcon_)

    this.currentState_.textContent = this.localization.resolve(this.fullWindowEnabled_ ? 'ON' : 'OFF')

    this.button_.ariaLabel = this.fullWindowEnabled_ ? i18n.t('Video.Player.Exit Full Window') : i18n.t('Video.Player.Full Window')
  }
}
