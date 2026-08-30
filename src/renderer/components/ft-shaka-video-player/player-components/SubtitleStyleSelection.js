import shaka from 'shaka-player'

import i18n from '../../../i18n/index'
import { PlayerIcons } from '../../../../constants'

export class SubtitleStyleSelection extends shaka.ui.SettingsMenu {
  /**
   * @param {EventTarget} events
   * @param {!HTMLElement} parent
   * @param {!shaka.ui.Controls} controls
   */
  constructor(events, parent, controls) {
    super(parent, controls, PlayerIcons.TUNE_FILLED)

    this.button.classList.add('subtitle-style-button')
    this.menu.classList.add('subtitle-style-settings')

    /** @private {!HTMLElement} */
    this.mainOptions_ = document.createElement('div')
    /** @private {!HTMLElement} */
    this.sizeOptions_ = document.createElement('div')
    /** @private {!HTMLElement} */
    this.positionOptions_ = document.createElement('div')

    /** @private {!Map<number, {button: HTMLButtonElement, label: HTMLElement}>} */
    this.sizeItems_ = new Map()
    /** @private {!Map<shaka.config.PositionArea, {button: HTMLButtonElement, label: HTMLElement}>} */
    this.positionItems_ = new Map()

    /** @private {!HTMLButtonElement} */
    this.sizeButton_ = document.createElement('button')
    /** @private {!HTMLButtonElement} */
    this.positionButton_ = document.createElement('button')
    /** @private {!HTMLButtonElement} */
    this.sizeBackButton_ = this.createBackButton_()
    /** @private {!HTMLButtonElement} */
    this.positionBackButton_ = this.createBackButton_()

    this.createMenuOptions_()
    this.menu.append(this.mainOptions_, this.sizeOptions_, this.positionOptions_)

    this.eventManager.listen(events, 'localeChanged', () => {
      this.updateLocalizedStrings()
    })

    this.eventManager.listenMulti(
      this.player,
      ['loading', 'unloading', 'configurationchanged', 'trackschanged'],
      () => {
        this.updateSelection_()
        this.checkAvailability()
      }
    )

    this.updateLocalizedStrings()
    this.updateSelection_()
    this.showMenuView_('main', false)
    this.checkAvailability()
  }

  /** @override */
  checkAvailability() {
    const hasActiveTextTrack = (this.player.getTextTracks() || []).some(track => track.active)
    const available = hasActiveTextTrack && !this.isSubMenuOpened && this.controls.getConfig().captionsStyles

    shaka.ui.Utils.setDisplay(this.button, available)
    this.button.ariaPressed = available ? 'true' : 'false'
  }

  /** @override */
  updateLocalizedStrings() {
    const subtitleSettingsText = i18n.global.t('Video.Player.Subtitle Settings')
    const subtitleSizeText = this.localization.resolve('SUBTITLE_SIZE')
    const subtitlePositionText = this.localization.resolve('SUBTITLE_POSITION')

    this.button.ariaLabel = subtitleSettingsText
    this.nameSpan.textContent = subtitleSettingsText
    this.currentSelection.textContent = ''
    this.backButton.ariaLabel = this.localization.resolve('BACK')
    this.backSpan.textContent = subtitleSettingsText

    this.sizeButton_.ariaLabel = subtitleSizeText
    this.sizeButton_.firstChild.textContent = subtitleSizeText
    this.positionButton_.ariaLabel = subtitlePositionText
    this.positionButton_.firstChild.textContent = subtitlePositionText

    this.updateBackButton_(this.sizeBackButton_, subtitleSettingsText)
    this.updateBackButton_(this.positionBackButton_, subtitleSettingsText)

    for (const [position, { label }] of this.positionItems_) {
      label.textContent = this.getPositionName_(position)
    }

    this.updateSelection_()
  }

  /** @override */
  onMenuOpen() {
    this.showMenuView_('main')
  }

  /** @override */
  onMenuClose() {
    this.controls.hideTextStylePreview()
    this.showMenuView_('main', false)
  }

  /** @private */
  createMenuOptions_() {
    this.addNavigationButton_(this.mainOptions_, this.sizeButton_, () => {
      this.controls.showTextStylePreview()
      this.showMenuView_('size')
    })
    this.addNavigationButton_(this.mainOptions_, this.positionButton_, () => {
      this.controls.showTextStylePreview()
      this.showMenuView_('position')
    })

    this.sizeOptions_.appendChild(this.sizeBackButton_)
    this.positionOptions_.appendChild(this.positionBackButton_)

    this.eventManager.listen(this.sizeBackButton_, 'click', event => {
      event.stopPropagation()
      this.controls.resetTextStylePreview()
      this.showMenuView_('main')
    })
    this.eventManager.listen(this.positionBackButton_, 'click', event => {
      event.stopPropagation()
      this.controls.resetTextStylePreview()
      this.showMenuView_('main')
    })

    for (const fontScaleFactor of this.controls.getConfig().captionsFontScaleFactors) {
      const item = this.createSelectionButton_(
        `${fontScaleFactor * 100}%`,
        () => this.player.configure('textDisplayer.fontScaleFactor', fontScaleFactor),
        { fontScaleFactor }
      )

      this.sizeItems_.set(fontScaleFactor, item)
      this.sizeOptions_.appendChild(item.button)
    }

    for (const positionArea of Object.values(shaka.config.PositionArea)) {
      const item = this.createSelectionButton_(
        this.getPositionName_(positionArea),
        () => this.player.configure('textDisplayer.positionArea', positionArea),
        { positionArea }
      )

      this.positionItems_.set(positionArea, item)
      this.positionOptions_.appendChild(item.button)
    }
  }

  /**
   * @param {!HTMLElement} parent
   * @param {!HTMLButtonElement} button
   * @param {() => void} onClick
   * @private
   */
  addNavigationButton_(parent, button, onClick) {
    const label = document.createElement('span')
    button.appendChild(label)

    this.eventManager.listen(button, 'click', event => {
      event.stopPropagation()
      onClick()
    })

    parent.appendChild(button)
  }

  /**
   * @param {string} labelText
   * @param {() => void} onClick
   * @param {{fontScaleFactor?: number, positionArea?: shaka.config.PositionArea}} previewConfig
   * @returns {{button: HTMLButtonElement, label: HTMLElement}}
   * @private
   */
  createSelectionButton_(labelText, onClick, previewConfig) {
    const button = document.createElement('button')
    button.setAttribute('role', 'menuitemradio')
    button.setAttribute('aria-checked', 'false')

    const label = document.createElement('span')
    label.textContent = labelText
    button.appendChild(label)

    this.eventManager.listen(button, 'click', () => {
      onClick()
      this.updateSelection_()
    })
    shaka.ui.Utils.addHoverAndFocusListeners(
      this.eventManager,
      button,
      () => this.controls.updateTextStylePreview(previewConfig),
      () => this.controls.resetTextStylePreview()
    )

    return { button, label }
  }

  /**
   * @returns {!HTMLButtonElement}
   * @private
   */
  createBackButton_() {
    const button = document.createElement('button')
    button.classList.add('shaka-back-to-overflow-button')

    new shaka.ui.Icon(button, shaka.ui.Enums.MaterialDesignSVGIcons.BACK)

    button.appendChild(document.createElement('span'))
    return button
  }

  /**
   * @param {!HTMLButtonElement} button
   * @param {string} text
   * @private
   */
  updateBackButton_(button, text) {
    button.ariaLabel = this.localization.resolve('BACK')
    button.lastChild.textContent = text
  }

  /**
   * @param {'main'|'size'|'position'} view
   * @param {boolean=} focus
   * @private
   */
  showMenuView_(view, focus = true) {
    shaka.ui.Utils.setDisplay(this.backButton, view === 'main')
    shaka.ui.Utils.setDisplay(this.mainOptions_, view === 'main')
    shaka.ui.Utils.setDisplay(this.sizeOptions_, view === 'size')
    shaka.ui.Utils.setDisplay(this.positionOptions_, view === 'position')

    if (!focus) {
      return
    }

    const selectedItem = view === 'size'
      ? this.sizeItems_.get(this.player.getConfiguration().textDisplayer.fontScaleFactor)
      : view === 'position'
        ? this.positionItems_.get(this.player.getConfiguration().textDisplayer.positionArea)
        : null

    const fallbackButton = view === 'main'
      ? this.sizeButton_
      : view === 'size'
        ? this.sizeBackButton_
        : this.positionBackButton_

    const buttonToFocus = selectedItem?.button ?? fallbackButton
    buttonToFocus.focus()
  }

  /** @private */
  updateSelection_() {
    const { fontScaleFactor, positionArea } = this.player.getConfiguration().textDisplayer

    this.updateSelectedItems_(this.sizeItems_, fontScaleFactor)
    this.updateSelectedItems_(this.positionItems_, positionArea)
  }

  /**
   * @template T
   * @param {!Map<T, {button: HTMLButtonElement, label: HTMLElement}>} items
   * @param {T} currentValue
   * @private
   */
  updateSelectedItems_(items, currentValue) {
    for (const [value, { button, label }] of items) {
      const selected = value === currentValue
      const checkmark = button.querySelector('.shaka-ui-icon.shaka-chosen-item')

      button.setAttribute('aria-checked', selected ? 'true' : 'false')
      label.classList.toggle('shaka-chosen-item', selected)

      if (selected && !checkmark) {
        button.appendChild(shaka.ui.Utils.checkmarkIcon())
      } else if (!selected) {
        checkmark?.remove()
      }
    }
  }

  /**
   * @param {shaka.config.PositionArea} position
   * @returns {string}
   * @private
   */
  getPositionName_(position) {
    switch (position) {
      case shaka.config.PositionArea.DEFAULT:
        return this.localization.resolve('DEFAULT')
      case shaka.config.PositionArea.TOP_LEFT:
        return this.localization.resolve('TOP_LEFT')
      case shaka.config.PositionArea.TOP_CENTER:
        return this.localization.resolve('TOP_CENTER')
      case shaka.config.PositionArea.TOP_RIGHT:
        return this.localization.resolve('TOP_RIGHT')
      case shaka.config.PositionArea.CENTER_LEFT:
        return this.localization.resolve('CENTER_LEFT')
      case shaka.config.PositionArea.CENTER:
        return this.localization.resolve('CENTER')
      case shaka.config.PositionArea.CENTER_RIGHT:
        return this.localization.resolve('CENTER_RIGHT')
      case shaka.config.PositionArea.BOTTOM_LEFT:
        return this.localization.resolve('BOTTOM_LEFT')
      case shaka.config.PositionArea.BOTTOM_CENTER:
        return this.localization.resolve('BOTTOM_CENTER')
      case shaka.config.PositionArea.BOTTOM_RIGHT:
        return this.localization.resolve('BOTTOM_RIGHT')
    }

    return ''
  }
}
