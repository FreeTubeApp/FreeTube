import i18n from '../i18n/index'

export function getColors() {
  return [
    { name: 'Red', value: '#d50000', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Red') },
    { name: 'Pink', value: '#C51162', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Pink') },
    { name: 'Purple', value: '#AA00FF', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Purple') },
    { name: 'DeepPurple', value: '#6200EA', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Deep Purple') },
    { name: 'Indigo', value: '#304FFE', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Indigo') },
    { name: 'Blue', value: '#2962FF', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Blue') },
    { name: 'LightBlue', value: '#0091EA', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Light Blue') },
    { name: 'Cyan', value: '#00B8D4', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Cyan') },
    { name: 'Teal', value: '#00BFA5', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Teal') },
    { name: 'Green', value: '#00C853', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Green') },
    { name: 'LightGreen', value: '#64DD17', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Light Green') },
    { name: 'Lime', value: '#AEEA00', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Lime') },
    { name: 'Yellow', value: '#FFD600', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Yellow') },
    { name: 'Amber', value: '#FFAB00', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Amber') },
    { name: 'Orange', value: '#FF6D00', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Orange') },
    { name: 'DeepOrange', value: '#DD2C00', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Deep Orange') },
    { name: 'DraculaCyan', value: '#8BE9FD', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Cyan') },
    { name: 'DraculaGreen', value: '#50FA7B', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Green') },
    { name: 'DraculaOrange', value: '#FFB86C', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Orange') },
    { name: 'DraculaPink', value: '#FF79C6', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Pink') },
    { name: 'DraculaPurple', value: '#BD93F9', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Purple') },
    { name: 'DraculaRed', value: '#FF5555', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Red') },
    { name: 'DraculaYellow', value: '#F1FA8C', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Dracula Yellow') },
    { name: 'CatppuccinMochaRosewater', value: '#F5E0DC', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Rosewater') },
    { name: 'CatppuccinMochaFlamingo', value: '#F2CDCD', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Flamingo') },
    { name: 'CatppuccinMochaPink', value: '#F5C2E7', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Pink') },
    { name: 'CatppuccinMochaMauve', value: '#CBA6F7', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Mauve') },
    { name: 'CatppuccinMochaRed', value: '#F38BA8', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Red') },
    { name: 'CatppuccinMochaMaroon', value: '#EBA0AC', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Maroon') },
    { name: 'CatppuccinMochaPeach', value: '#FAB387', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Peach') },
    { name: 'CatppuccinMochaYellow', value: '#F9E2AF', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Yellow') },
    { name: 'CatppuccinMochaGreen', value: '#A6E3A1', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Green') },
    { name: 'CatppuccinMochaTeal', value: '#94E2D5', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Teal') },
    { name: 'CatppuccinMochaSky', value: '#89DCEB', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Sky') },
    { name: 'CatppuccinMochaSapphire', value: '#74C7EC', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Sapphire') },
    { name: 'CatppuccinMochaBlue', value: '#89B4FA', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Blue') },
    { name: 'CatppuccinMochaLavender', value: '#B4BEFE', translated: i18n.t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Lavender') }
  ]
}
export function getRandomColorClass() {
  return 'main' + getRandomColor().name
}

export function getRandomColor() {
  const colors = getColors()
  const randomInt = Math.floor(Math.random() * colors.length)
  return colors[randomInt]
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
