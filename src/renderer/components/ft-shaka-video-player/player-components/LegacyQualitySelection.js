import shaka from 'shaka-player'

export class LegacyQualitySelection extends shaka.ui.SettingsMenu {
  /**
   * @param {object} activeLegacyFormat
   * @param {object[]} legacyFormats
   * @param {EventTarget} events
   * @param {!HTMLElement} parent
   * @param {!shaka.ui.Controls} controls
   */
  constructor(activeLegacyFormat, legacyFormats, events, parent, controls) {
    super(parent, controls, 'settings')

    this.button.classList.add('legacy-quality-button')
    this.button.classList.add('shaka-tooltip-status')
    this.menu.classList.add('legacy-qualities')

    /** @private */
    this.events_ = events
    /** @private */
    this.activeLegacyFormat_ = activeLegacyFormat

    const sortedLegacyFormats = [...legacyFormats]

    // Invidious doesn't return the height or width for the legacy formats, so we have to use the bitrate instead
    if (typeof legacyFormats[0].width === 'undefined' || typeof legacyFormats[0].height === 'undefined') {
      sortedLegacyFormats.sort((a, b) => {
        return b.bitrate - a.bitrate
      })
    } else {
      const isPortrait = legacyFormats[0].height > legacyFormats[0].width
      sortedLegacyFormats.sort((a, b) => isPortrait ? b.width - a.width : b.height - a.height)
    }

    /** @private */
    this.legacyFormats_ = sortedLegacyFormats

    for (const format of sortedLegacyFormats) {
      const button = document.createElement('button')
      button.classList.add('legacy-resolution')

      this.eventManager.listen(button, 'click', () => {
        this.onFormatSelected_(format)
      })

      const span = document.createElement('span')
      span.textContent = format.qualityLabel
      button.appendChild(span)

      this.menu.appendChild(button)
    }

    // listeners

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(events, 'setLegacyFormat', (/** @type {CustomEvent} */ event) => {
      this.activeLegacyFormat_ = event.detail.format
      this.updateResolutionSelection_()
    })

    this.updateResolutionSelection_()
  }

  /** @private */
  updateResolutionSelection_() {
    if (!this.activeLegacyFormat_) {
      return
    }

    // remove previous selection

    const previousSpan = this.menu.querySelector('.shaka-chosen-item')
    if (previousSpan) {
      previousSpan.classList.remove('shaka-chosen-item')

      const button = previousSpan.parentElement
      button.ariaSelected = 'false'
      button.querySelector('.material-icons-round').remove()
    }

    // current selection

    const index = this.legacyFormats_.indexOf(this.activeLegacyFormat_)

    const button = this.menu.querySelectorAll('.legacy-resolution')[index]
    const span = button.querySelector('span')

    button.ariaSelected = 'true'

    span.classList.add('shaka-chosen-item')

    const icon = document.createElement('i')
    icon.classList.add('material-icons-round')
    icon.classList.add('shaka-chosen-item')
    icon.textContent = 'done'
    icon.ariaHidden = 'true'
    button.appendChild(icon)

    this.currentSelection.textContent = span.textContent

    this.button.setAttribute('shaka-status', span.textContent)

    button.focus()

    this.updateLocalisedStrings_()
  }

  /** @private */
  async onFormatSelected_(format) {
    if (format === this.activeLegacyFormat_) {
      return
    }

    const playbackPosition = this.player.getMediaElement().currentTime

    const activeCaptionIndex = this.player.getTextTracks().findIndex(caption => caption.active)
    let restoreCaptionIndex = null

    if (activeCaptionIndex >= 0 && this.player.isTextTrackVisible()) {
      restoreCaptionIndex = activeCaptionIndex

      // hide captions before switching as shaka/the browser doesn't clean up the displayed captions
      // when switching away from the legacy formats
      await this.player.setTextTrackVisibility(false)
    }

    this.events_.dispatchEvent(new CustomEvent('setLegacyFormat', {
      detail: {
        format,
        playbackPosition,
        restoreCaptionIndex
      }
    }))
  }

  /** @private */
  updateLocalisedStrings_() {
    const resolutionText = this.localization.resolve('RESOLUTION')

    this.button.ariaLabel = resolutionText
    this.backButton.ariaLabel = resolutionText
    this.backSpan.textContent = resolutionText
    this.nameSpan.textContent = resolutionText
  }
}
