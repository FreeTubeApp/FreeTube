import { randomArrayItem } from './utils'

// When adding new colors here,
// remember to update the name translations in `src/renderer/composables/colors.js`
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
  { name: 'CatppuccinFrappeRosewater', value: '#f2d5cf' },
  { name: 'CatppuccinFrappeFlamingo', value: '#eebebe' },
  { name: 'CatppuccinFrappePink', value: '#f4b8e4' },
  { name: 'CatppuccinFrappeMauve', value: '#ca9ee6' },
  { name: 'CatppuccinFrappeRed', value: '#e78284' },
  { name: 'CatppuccinFrappeMaroon', value: '#ea999c' },
  { name: 'CatppuccinFrappePeach', value: '#ef9f76' },
  { name: 'CatppuccinFrappeYellow', value: '#e5c890' },
  { name: 'CatppuccinFrappeGreen', value: '#a6d189' },
  { name: 'CatppuccinFrappeTeal', value: '#81c8be' },
  { name: 'CatppuccinFrappeSky', value: '#99d1db' },
  { name: 'CatppuccinFrappeSapphire', value: '#85c1dc' },
  { name: 'CatppuccinFrappeBlue', value: '#8caaee' },
  { name: 'CatppuccinFrappeLavender', value: '#babbf1' },
  { name: 'CatppuccinLatteMauve', value: '#8839ef' },
  { name: 'CatppuccinLatteRed', value: '#d20f39' },
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
  { name: 'EverforestDarkRed', value: '#E67E80' },
  { name: 'EverforestDarkOrange', value: '#E69875' },
  { name: 'EverforestDarkYellow', value: '#DBBC7F' },
  { name: 'EverforestDarkGreen', value: '#A7C080' },
  { name: 'EverforestDarkAqua', value: '#83C092' },
  { name: 'EverforestDarkBlue', value: '#7FBBB3' },
  { name: 'EverforestDarkPurple', value: '#D699B6' },
  { name: 'EverforestLightRed', value: '#D83532' },
  { name: 'EverforestLightOrange', value: '#D55D0F' },
  { name: 'EverforestLightYellow', value: '#A96E00' },
  { name: 'EverforestLightGreen', value: '#6D8100' },
  { name: 'EverforestLightAqua', value: '#25976C' },
  { name: 'EverforestLightBlue', value: '#2a84b5' },
  { name: 'EverforestLightPurple', value: '#CF59aa' },
  { name: 'GruvboxDarkGreen', value: '#b8bb26' },
  { name: 'GruvboxDarkYellow', value: '#fabd2f' },
  { name: 'GruvboxDarkBlue', value: '#83a593' },
  { name: 'GruvboxDarkPurple', value: '#d3869b' },
  { name: 'GruvboxDarkAqua', value: '#8ec07c' },
  { name: 'GruvboxDarkOrange', value: '#fe8019' },
  { name: 'GruvboxLightRed', value: '#9d0006' },
  { name: 'GruvboxLightBlue', value: '#076678' },
  { name: 'GruvboxLightPurple', value: '#8f3f71' },
  { name: 'GruvboxLightOrange', value: '#af3a03' },
  { name: 'SolarizedYellow', value: '#b58900' },
  { name: 'SolarizedOrange', value: '#cb4b16' },
  { name: 'SolarizedRed', value: '#dc322f' },
  { name: 'SolarizedMagenta', value: '#d33682' },
  { name: 'SolarizedViolet', value: '#6c71c4' },
  { name: 'SolarizedBlue', value: '#268bd2' },
  { name: 'SolarizedCyan', value: '#2aa198' },
  { name: 'SolarizedGreen', value: '#859900' },
]

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
