import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { deduplicateAudioTracks } from '../../../helpers/player/utils'
import { PlayerIcons } from '../../../../constants'

export class AudioTrackSelection extends shaka.ui.SettingsMenu {
  /**
   * @param {EventTarget} events
   * @param {!HTMLElement} parent
   * @param {!shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls, PlayerIcons.RECORD_VOICE_OVER_FILLED)

    this.button.classList.add('audio-track-button', 'shaka-tooltip-status')
    this.menu.classList.add('audio-tracks')

    /** @type {SVGElement} */
    const checkmarkIcon = new shaka.ui.MaterialSVGIcon(null, PlayerIcons.DONE_FILLED).getSvgElement()
    checkmarkIcon.classList.add('shaka-chosen-item')
    checkmarkIcon.ariaHidden = 'true'

    /** @private */
    this._checkmarkIcon = checkmarkIcon

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalisedStrings_()
    })

    this.eventManager.listen(this.player, 'loading', () => {
      this.updateAudioTracks_()
    })

    this.eventManager.listen(this.player, 'trackschanged', () => {
      this.updateAudioTracks_()
    })

    this.eventManager.listen(this.player, 'variantchanged', () => {
      this.updateAudioTracks_()
    })

    this.eventManager.listen(this.player, 'adaptation', () => {
      this.updateAudioTracks_()
    })

    this.updateLocalisedStrings_()

    this.updateAudioTracks_()
  }

  /**
   * @private
   */
  updateAudioTracks_() {
    const tracks = deduplicateAudioTracks(this.player.getAudioTracks()).values()

    const menu = this.menu

    const backButton = menu.querySelector('.shaka-back-to-overflow-button')

    while (menu.firstChild) {
      menu.removeChild(menu.firstChild)
    }

    menu.appendChild(backButton)

    let count = 0

    for (const track of tracks) {
      const button = document.createElement('button')
      button.addEventListener('click', () => {
        this.onAudioTrackSelected_(track)
      })

      const span = document.createElement('span')
      button.appendChild(span)

      span.textContent = track.label || new Intl.DisplayNames('en', { type: 'language', languageDisplay: 'standard' }).of(track.language)

      if (track.active) {
        button.appendChild(this._checkmarkIcon)

        span.classList.add('shaka-chosen-item')
        button.ariaSelected = 'true'
        this.currentSelection.textContent = span.textContent
      }

      menu.appendChild(button)
      count++
    }

    menu.querySelector('shaka-chosen-item')?.parentElement.focus()

    this.button.setAttribute('shaka-status', this.currentSelection.innerText)

    if (count > 1) {
      this.button.classList.remove('shaka-hidden')
    } else {
      this.button.classList.add('shaka-hidden')
    }
  }

  /**
   * @param {shaka.extern.AudioTrack} track
   * @private
   */
  onAudioTrackSelected_(track) {
    track.codecs = null

    this.player.selectAudioTrack(track)

    const config = {
      preferSpatialAudio: track.spatialAudio
    }

    if (track.language !== 'und') {
      config.preferredAudioLanguage = track.language
    }

    if (track.label) {
      config.preferredAudioLabel = track.label
    }

    if (track.channelsCount) {
      config.preferredAudioChannelCount = track.channelsCount
    }

    this.player.configure(config)
  }

  /** @private */
  updateLocalisedStrings_() {
    this.backButton.ariaLabel = this.localization.resolve('BACK')

    const audioTracksText = i18n.global.t('Video.Player.Audio Tracks')

    this.button.ariaLabel = audioTracksText
    this.nameSpan.textContent = audioTracksText
    this.backSpan.textContent = audioTracksText
  }
}
