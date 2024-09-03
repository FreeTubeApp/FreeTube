import shaka from 'shaka-player'

import i18n from '../../../i18n/index'

export class AudioTrackSelection extends shaka.ui.SettingsMenu {
  /**
   * @param {EventTarget} events
   * @param {!HTMLElement} parent
   * @param {!shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls, 'spatial_audio_off')

    this.button.classList.add('audio-track-button', 'shaka-tooltip-status')
    this.menu.classList.add('audio-tracks')

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(this.player, 'loading', () => {
      this.onTracksChanged_()
    })

    this.eventManager.listen(this.player, 'trackschanged', () => {
      this.onTracksChanged_()
    })

    this.eventManager.listen(this.player, 'variantchanged', () => {
      this.updateAudioTracks_()
    })

    // selectVariantsByLabel doesn't trigger variant changed
    this.eventManager.listen(this.player, 'adaptation', () => {
      this.updateAudioTracks_()
    })

    this.updateLocalisedStrings_()

    this.updateAudioTracks_()
  }

  /** @private */
  updateAudioTracks_() {
    const tracks = this.player.getVariantTracks()

    const selectedTrack = tracks.find(track => track.active)

    const menu = this.menu

    const backButton = menu.querySelector('.shaka-back-to-overflow-button')

    while (menu.firstChild) {
      menu.removeChild(menu.firstChild)
    }

    menu.appendChild(backButton)

    /** @type {Set<string>} */
    const knownLabels = new Set()

    for (const track of tracks) {
      if (!track.label || knownLabels.has(track.label)) {
        continue
      }

      knownLabels.add(track.label)

      const button = document.createElement('button')
      button.addEventListener('click', () => {
        this.onAudioTrackSelected_(track)
      })

      const span = document.createElement('span')
      button.appendChild(span)

      span.textContent = track.label

      if (selectedTrack && track.label === selectedTrack.label) {
        const icon = document.createElement('i')
        icon.classList.add('material-icons-round', 'shaka-chosen-item')
        icon.textContent = 'done'
        icon.ariaHidden = 'true'
        button.appendChild(icon)

        span.classList.add('shaka-chosen-item')
        button.ariaSelected = 'true'
        this.currentSelection.textContent = span.textContent
      }

      menu.appendChild(button)
    }

    menu.querySelector('shaka-chosen-item')?.parentElement.focus()

    this.button.setAttribute('shaka-status', this.currentSelection.innerText)

    if (knownLabels.size > 0) {
      this.button.classList.remove('shaka-hidden')
    } else {
      this.button.classList.add('shaka-hidden')
    }
  }

  /** @private */
  onTracksChanged_() {
    const hasVariants = this.player.getVariantTracks().length > 0

    if (hasVariants) {
      this.button.classList.remove('shaka-hidden')
    } else {
      this.button.classList.add('shaka-hidden')
    }

    this.updateAudioTracks_()
  }

  /**
   * @param {shaka.extern.Track} track
   * @private
   */
  onAudioTrackSelected_(track) {
    this.player.selectVariantsByLabel(track.label)
  }

  /** @private */
  updateLocalisedStrings_() {
    this.backButton.ariaLabel = this.localization.resolve('BACK')

    const audioTracksText = i18n.t('Video.Player.Audio Tracks')

    this.button.ariaLabel = audioTracksText
    this.nameSpan.textContent = audioTracksText
    this.backSpan.textContent = audioTracksText
  }
}
