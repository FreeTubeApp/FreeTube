import shaka from 'shaka-player'

import i18n from '../../../i18n/index'

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
    this.icon_ = document.createElement('i')
    this.icon_.classList.add('material-icons-round')
    this.icon_.textContent = 'open_in_full'

    this.button_.appendChild(this.icon_)

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
    this.nameSpan_.textContent = i18n.t('Video.Player.Full Window')

    this.icon_.textContent = this.fullWindowEnabled_ ? 'close_fullscreen' : 'open_in_full'

    this.currentState_.textContent = this.localization.resolve(this.fullWindowEnabled_ ? 'ON' : 'OFF')

    this.button_.ariaLabel = this.fullWindowEnabled_ ? i18n.t('Video.Player.Exit Full Window') : i18n.t('Video.Player.Full Window')
  }
}
