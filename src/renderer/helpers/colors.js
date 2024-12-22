import i18n from '../i18n/index'
import { randomArrayItem } from './utils'

export const colors = [
  { name: 'Red', value: '#d50000' },
  { name: 'Pink', value: '#C51162' },
  { name: 'Purple', value: '#AA00FF' },
  { name: 'DeepPurple', value: '#6200EA' },
  { name: 'Indigo', value: '#304FFE' },
  { name: 'Blue', value: '#2962FF' },
  { name: 'LightBlue', value: '#0091EA' },
  { name: 'Cyan', value: '#00B8D4' },
  { name: 'Teal', value: '#00BFA5' },
  { name: 'Green', value: '#00C853' },
  { name: 'LightGreen', value: '#64DD17' },
  { name: 'Lime', value: '#AEEA00' },
  { name: 'Yellow', value: '#FFD600' },
  { name: 'Amber', value: '#FFAB00' },
  { name: 'Orange', value: '#FF6D00' },
  { name: 'DeepOrange', value: '#DD2C00' },
  { name: 'CatppuccinMochaRosewater', value: '#F5E0DC' },
  { name: 'CatppuccinMochaFlamingo', value: '#F2CDCD' },
  { name: 'CatppuccinMochaPink', value: '#F5C2E7' },
  { name: 'CatppuccinMochaMauve', value: '#CBA6F7' },
  { name: 'CatppuccinMochaRed', value: '#F38BA8' },
  { name: 'CatppuccinMochaMaroon', value: '#EBA0AC' },
  { name: 'CatppuccinMochaPeach', value: '#FAB387' },
  { name: 'CatppuccinMochaYellow', value: '#F9E2AF' },
  { name: 'CatppuccinMochaGreen', value: '#A6E3A1' },
  { name: 'CatppuccinMochaTeal', value: '#94E2D5' },
  { name: 'CatppuccinMochaSky', value: '#89DCEB' },
  { name: 'CatppuccinMochaSapphire', value: '#74C7EC' },
  { name: 'CatppuccinMochaBlue', value: '#89B4FA' },
  { name: 'CatppuccinMochaLavender', value: '#B4BEFE' },
  { name: 'DraculaCyan', value: '#8BE9FD' },
  { name: 'DraculaGreen', value: '#50FA7B' },
  { name: 'DraculaOrange', value: '#FFB86C' },
  { name: 'DraculaPink', value: '#FF79C6' },
  { name: 'DraculaPurple', value: '#BD93F9' },
  { name: 'DraculaRed', value: '#FF5555' },
  { name: 'DraculaYellow', value: '#F1FA8C' },
  { name: 'SolarizedYellow', value: '#b58900' },
  { name: 'SolarizedOrange', value: '#cb4b16' },
  { name: 'SolarizedRed', value: '#dc322f' },
  { name: 'SolarizedMagenta', value: '#d33682' },
  { name: 'SolarizedViolet', value: '#6c71c4' },
  { name: 'SolarizedBlue', value: '#268bd2' },
  { name: 'SolarizedCyan', value: '#2aa198' },
  { name: 'SolarizedGreen', value: '#859900' },
]

export function getColorTranslations() {
  return [
    i18n.t('Settings.Theme Settings.Main Color Theme.Red'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Pink'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Purple'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Deep Purple'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Indigo'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Blue'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Light Blue'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Cyan'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Teal'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Green'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Light Green'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Lime'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Yellow'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Amber'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Orange'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Deep Orange'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Rosewater'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Flamingo'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Pink'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Mauve'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Red'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Maroon'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Peach'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Yellow'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Green'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Teal'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Sky'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Sapphire'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Blue'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Lavender'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Cyan'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Green'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Orange'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Pink'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Purple'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Red'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Yellow'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Yellow'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Orange'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Red'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Magenta'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Violet'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Blue'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Cyan'),
    i18n.t('Settings.Theme Settings.Main Color Theme.Solarized Green'),
  ]
}

export function getRandomColorClass() {
  return 'main' + getRandomColor().name
}

export function getRandomColor() {
  return randomArrayItem(colors)
}

export function calculateColorLuminance(colorValue) {
  const cutHex = colorValue.substring(1, 7)
  const colorValueR = parseInt(cutHex.substring(0, 2), 16)
  const colorValueG = parseInt(cutHex.substring(2, 4), 16)
  const colorValueB = parseInt(cutHex.substring(4, 6), 16)

  const luminance = (0.299 * colorValueR + 0.587 * colorValueG + 0.114 * colorValueB) / 255

  if (luminance > 0.5) {
    return '#000000'
  } else {
    return '#FFFFFF'
  }
}
