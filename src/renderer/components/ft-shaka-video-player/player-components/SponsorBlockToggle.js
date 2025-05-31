import store from '../../../store/index'
import shaka from 'shaka-player'

export function isSponsorBlockEnabled() {
  return store.getters.getUseSponsorBlock
}

export function toggleSponsorBlock() {
  const current = store.getters.getUseSponsorBlock
  return store.dispatch('updateUseSponsorBlock', !current)
}

export class SponsorBlockToggleButton extends shaka.ui.Element {
  constructor(events, parent, controls) {
    super(parent, controls)

    this.button_ = document.createElement('button')
    this.button_.classList.add('sponsorblock-toggle-button', 'shaka-tooltip')

    // Use a span as the icon container
    this.icon_ = document.createElement('span')
    this.icon_.classList.add('sponsorblock-svg-icon')
    this.button_.appendChild(this.icon_)

    const label = document.createElement('label')
    label.classList.add('shaka-overflow-button-label', 'shaka-overflow-menu-only')

    this.nameSpan_ = document.createElement('span')
    this.nameSpan_.textContent = 'SponsorBlock'
    label.appendChild(this.nameSpan_)

    this.currentState_ = document.createElement('span')
    this.currentState_.classList.add('shaka-current-selection-span')
    label.appendChild(this.currentState_)

    this.button_.appendChild(label)
    this.parent.appendChild(this.button_)

    this.sponsorBlockEnabled_ = isSponsorBlockEnabled()
    this.updateLocalisedStrings_()

    store.watch(
      () => store.getters.getUseSponsorBlock,
      (newVal) => {
        this.sponsorBlockEnabled_ = newVal
        this.updateLocalisedStrings_()
      }
    )

    events.addEventListener('toggleSponsorBlock', async () => {
      await toggleSponsorBlock()
    })

    // Add this for click support:
    this.button_.addEventListener('click', async (e) => {
      e.preventDefault()
      await toggleSponsorBlock()
    })
  }

  // use an svg for the ui because that is easiest
  /** @private */
  updateLocalisedStrings_() {
    const shieldSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7v5c0 5.55 3.84 10.74 10 13 6.16-2.26 10-7.45 10-13V7l-10-5z"/>
    </svg>`
    const shieldLineSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7v5c0 5.55 3.84 10.74 10 13 6.16-2.26 10-7.45 10-13V7l-10-5z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="5" y1="19" x2="19" y2="5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`
    this.icon_.innerHTML = this.sponsorBlockEnabled_ ? shieldSVG : shieldLineSVG
    this.nameSpan_.textContent = 'SponsorBlock'
    this.button_.ariaLabel = 'SponsorBlock'
  }
}
