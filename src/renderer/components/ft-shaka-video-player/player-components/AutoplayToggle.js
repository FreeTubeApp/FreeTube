import shaka from 'shaka-player'

import i18n from '../../../i18n/index'

export class AutoplayToggle extends shaka.ui.Element {
  /**
   * @param {boolean} autoplayEnabled
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(autoplayEnabled, events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('autoplay-toggle')
    this.button_.classList.add('shaka-tooltip')

    /** @private */
    this.icon_ = document.createElement('i')
    this.icon_.classList.add('material-icons-round')
    this.icon_.textContent = 'pause_circle'

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
    this.autoplayEnabled_ = autoplayEnabled

    // listeners

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('toggleAutoplay', {
        detail: !this.autoplayEnabled_
      }))
    })

    const handleAutoplayValueChange = (/** @type {CustomEvent} */ event) => {
      this.autoplayEnabled_ = event.detail
      this.updateLocalisedStrings_()
    }

    this.eventManager.listen(events, 'setAutoplay', handleAutoplayValueChange)

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    this.nameSpan_.textContent = i18n.t('Video.Autoplay')

    this.icon_.textContent = this.autoplayEnabled_ ? 'play_circle' : 'pause_circle'

    this.currentState_.textContent = this.localization.resolve(this.autoplayEnabled_ ? 'ON' : 'OFF')

    this.button_.ariaLabel = this.autoplayEnabled_ ? i18n.t('Video.Player.Autoplay is on') : i18n.t('Video.Player.Autoplay is off')
  }
}
