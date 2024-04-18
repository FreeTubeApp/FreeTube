import shaka from 'shaka-player'
import { icon as faIcon } from '@fortawesome/fontawesome-svg-core'

import i18n from '../../../i18n'

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
    this.button_.classList.add('theatre-button')
    this.button_.classList.add('shaka-tooltip')

    /** @private */
    this.enableIcon_ = faIcon({ prefix: 'fas', iconName: 'tv' }).node[0]
    this.enableIcon_.classList.add('player-icon')

    /** @private */
    this.disableIcon_ = faIcon({ prefix: 'fas', iconName: 'display' }).node[0]
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
    this.theatreModeEnabled_ = theatreModeEnabled

    // listeners

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('toggleTheatreMode', {
        detail: {
          enabled: !this.theatreModeEnabled_
        }
      }))
    })

    this.eventManager.listen(events, 'toggleTheatreMode', (/** @type {CustomEvent} */event) => {
      this.theatreModeEnabled_ = event.detail.enabled

      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    this.nameSpan_.textContent = i18n.t('Video.Player.Theatre Mode')

    this.button_.firstChild.replaceWith(this.theatreModeEnabled_ ? this.disableIcon_ : this.enableIcon_)

    this.currentState_.textContent = this.localization.resolve(this.theatreModeEnabled_ ? 'ON' : 'OFF')

    this.button_.ariaLabel = this.theatreModeEnabled_ ? i18n.t('Video.Player.Exit Theatre Mode') : i18n.t('Video.Player.Theatre Mode')
  }
}
