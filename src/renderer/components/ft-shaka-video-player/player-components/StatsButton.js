import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { KeyboardShortcuts, PlayerIcons } from '../../../../constants'
import { addKeyboardShortcutToActionTitle } from '../../../helpers/utils'

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
    this.icon_ = new shaka.ui.MaterialSVGIcon(this.button_, PlayerIcons.INSERT_CHART_DEFAULT)

    const label = document.createElement('label')
    label.classList.add('shaka-overflow-button-label', 'shaka-simple-overflow-button-label-inline')

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
    this.icon_.use(this.showStats_ ? PlayerIcons.INSERT_CHART_FILLED : PlayerIcons.INSERT_CHART_DEFAULT)

    const baseLabel = this.showStats_ ? i18n.t('Video.Player.Hide Stats') : i18n.t('Video.Player.Show Stats')
    const label = addKeyboardShortcutToActionTitle(
      baseLabel,
      KeyboardShortcuts.VIDEO_PLAYER.GENERAL.STATS
    )

    this.nameSpan_.textContent = label
    this.button_.ariaLabel = label
  }
}
