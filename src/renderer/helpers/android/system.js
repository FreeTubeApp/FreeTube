import android from 'android'

function isDark(color) {
  const value = color.trim().startsWith('#')
    ? color.trim().slice(1).match(/.{2}/g)?.map((part) => parseInt(part, 16))
    : color.match(/\d+/g)?.map(Number)
  const [red, green, blue] = value || [0, 0, 0]
  return (red * 299 + green * 587 + blue * 114) < 128000
}

export function updateAndroidTheme(usesMain = false) {
  const style = getComputedStyle(document.body)
  const top = usesMain
    ? style.getPropertyValue('--primary-color')
    : style.getPropertyValue('--card-bg-color')
  const bottom = style.getPropertyValue('--side-nav-color')
  android.themeSystemUi(bottom, top, isDark(bottom), isDark(top))
}

export function getConsoleLogs() {
  return JSON.parse(android.getLogs())
}
