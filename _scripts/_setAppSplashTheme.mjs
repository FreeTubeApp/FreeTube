import { readFile, readdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'

// sets the splashscreen & icon to one of three predefined themes (this makes it easier to tell, at a glance, which one is open)
// - release (the default production look)
// - nightly
// OR
// - development

const COLOURS = {
  RELEASE: {
    primary: '#f04242',
    secondary: '#14a4df',
    back: '#E4E4E4',
    backDark: '#212121'
  },
  // catppucin mocha theme colours
  NIGHTLY: {
    primary: '#cdd6f4',
    secondary: '#cdd6f4',
    back: '#1e1e2e',
    backDark: '#1e1e2e'
  },
  // inverted release colours
  DEVELOPMENT: {
    primary: '#E4E4E4',
    secondary: '#E4E4E4',
    back: '#f04242',
    backDark: '#f04242'
  },
  // blue from the logo as the background colour
  RC: {
    primary: '#E4E4E4',
    secondary: '#E4E4E4',
    back: '#14a4df',
    backDark: '#14a4df'
  },
  // solarised dark
  FEATURE_BRANCH: {
    primary: '#E4E4E4',
    secondary: '#E4E4E4',
    back: '#204b56',
    backDark: '#204b56'
  }
}
let colour = 'RELEASE'
for (const key in COLOURS) {
  if (process.argv.indexOf(`--${key.toLowerCase().replaceAll('_', '-')}`) !== -1) {
    colour = key
  }
}

const currentTheme = COLOURS[colour]

const scriptDir = fileURLToPath(import.meta.url)
const drawablePath = join(scriptDir, '../../android/app/src/main/res/drawable/')

const foreground = join(drawablePath, 'ic_launcher_foreground.xml')
let foregroundXML = (await readFile(foreground)).toString()
foregroundXML = foregroundXML.replace(/<path android:fillColor="[^"]*?" android:strokeWidth="0\.784519" android:pathData="M 27/g, `<path android:fillColor="${currentTheme.primary}" android:strokeWidth="0.784519" android:pathData="M 27`)
foregroundXML = foregroundXML.replace(/<path android:fillColor="[^"]*?" android:strokeWidth="0\.784519" android:pathData="M 18/g, `<path android:fillColor="${currentTheme.primary}" android:strokeWidth="0.784519" android:pathData="M 18`)
foregroundXML = foregroundXML.replace(/<path android:fillColor="[^"]*?" android:strokeWidth="0\.784519" android:pathData="M 28/g, `<path android:fillColor="${currentTheme.secondary}" android:strokeWidth="0.784519" android:pathData="M 28`)
await writeFile(foreground, foregroundXML)

const background = join(drawablePath, 'ic_launcher_background.xml')
let backgroundXML = (await readFile(background)).toString()
backgroundXML = backgroundXML.replace(/android:fillColor="[^"]*?" \/>/g, `android:fillColor="${currentTheme.back}" />`)
await writeFile(background, backgroundXML)

/**
 * @warning name is passed into regex unsantised; should never be given user input
 * @param {string} xml
 * @param {string} name
 * @param {string} value
 */
function replaceItem(xml, name, value) {
  return xml.replace(new RegExp(`<item name="android:${name}">[^"]*?</item>`), `<item name="android:${name}">${value}</item>`)
}

async function constructThemePath(isDark = false, version = 0) {
  const resDirectory = join(scriptDir, '..', '..', 'android/app/src/main/res/')
  const files = await readdir(resDirectory)
  const versionsListed = files
    .filter(file => file.startsWith(`values${isDark ? '-night-' : '-'}v`))
    .map(file => parseInt(file.split('-v')[1]))
  if (versionsListed.indexOf(version) !== -1) {
    return join(resDirectory, `values${isDark ? '-night-' : '-'}v${version}`, 'themes.xml')
  } else {
    return join(resDirectory, 'values', 'themes.xml')
  }
}

async function setValuesForThemeFile(values, isDark = false, version = 0) {
  const themePath = await constructThemePath(isDark, version)
  let themeXml = (await readFile(themePath)).toString()
  for (const key in values) {
    themeXml = replaceItem(themeXml, key, values[key])
  }
  await writeFile(themePath, themeXml)
}

await setValuesForThemeFile({
  windowSplashScreenBackground: currentTheme.back,
  windowSplashScreenIconBackgroundColor: currentTheme.back
}, false, 31)

await setValuesForThemeFile({
  windowSplashScreenBackground: currentTheme.backDark,
  windowSplashScreenIconBackgroundColor: currentTheme.backDark
}, true, 31)

await setValuesForThemeFile({
  windowSplashScreenBackground: currentTheme.back,
  windowSplashScreenIconBackgroundColor: currentTheme.back
}, false, 33)

await setValuesForThemeFile({
  windowSplashScreenBackground: currentTheme.backDark,
  windowSplashScreenIconBackgroundColor: currentTheme.backDark
}, true, 33)
