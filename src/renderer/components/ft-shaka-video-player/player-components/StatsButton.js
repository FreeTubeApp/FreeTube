import shaka from 'shaka-player'
import { icon as faIcon } from '@fortawesome/fontawesome-svg-core'

import i18n from '../../../i18n'

export class StatsButton extends shaka.ui.Element {
  /**
   * @param {boolean} showStats
   * @param {EventTarget} events
   * @param {HTMLElement} parent
   * @param {shaka.ui.Controls} controls
   */
  constructor(showStats, events, parent, controls) {
    super(parent, controls)

    /** @private */
    this.button_ = document.createElement('button')
    this.button_.classList.add('stats-button')

    /** @private */
    this.enableIcon_ = faIcon({ prefix: 'fas', iconName: 'list' }).node[0]
    this.enableIcon_.classList.add('player-icon')

    /** @private */
    this.disableIcon_ = faIcon({ prefix: 'fas', iconName: 'rectangle-list' }).node[0]
    this.disableIcon_.classList.add('player-icon')

    this.button_.appendChild(this.enableIcon_)

    const label = document.createElement('label')
    label.classList.add('shaka-overflow-button-label')

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
    this.showStats_ = showStats

    // listeners

    this.eventManager.listen(this.button_, 'click', () => {
      events.dispatchEvent(new CustomEvent('setStatsVisibility', {
        detail: !this.showStats_
      }))
    })

    this.eventManager.listen(events, 'setStatsVisibility', (/** @type {CustomEvent} */ event) => {
      this.showStats_ = event.detail

      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.updateLocalisedStrings_()
  }

  /** @private */
  updateLocalisedStrings_() {
    this.nameSpan_.textContent = i18n.t('Video.Player.Stats.Stats')

    this.button_.firstChild.replaceWith(this.showStats_ ? this.disableIcon_ : this.enableIcon_)

    this.currentState_.textContent = this.localization.resolve(this.showStats_ ? 'ON' : 'OFF')

    this.button_.ariaLabel = this.showStats_ ? i18n.t('Video.Player.Hide Stats') : i18n.t('Video.Player.Show Stats')
  }
}
