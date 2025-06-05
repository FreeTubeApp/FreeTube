import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { load as loadYaml } from 'js-yaml'

const localesPath = join(import.meta.dirname, '..', 'static', 'locales')
const defaultLocale = 'en-US.yaml'

const errors = [

]

const defaultData = loadYaml(await readFile(`${localesPath}/${defaultLocale}`, { encoding: 'utf-8' }))
const defaultKeys = Object.keys(defaultData)

const filesInLocaleDir = await readdir(localesPath)

for (const file of filesInLocaleDir) {
  if (file !== defaultLocale) {
    const fileData = loadYaml(await readFile(`${localesPath}/${file}`, { encoding: 'utf-8' }))
    const fileDataKeys = Object.keys(fileData)
    addErrors(defaultData, fileData, defaultKeys, fileDataKeys, file)
  }
}

writeFile('locale-errors.json', JSON.stringify(errors, null, 2))

function addErrors(originalData, newData, originalKeys, newKeys, file) {
  newKeys.forEach(fdk => {
    if (!originalKeys.includes(fdk)) {
      // errors.push({ fileName: file, error: 'extra key found', key: fdk })
    } else {
      if (typeof originalData[fdk] === 'object') {
        addErrors(originalData[fdk], newData[fdk], Object.keys(originalData[fdk]), Object.keys(newData[fdk]), file)
      } else if (isMissingInterpolation(originalData[fdk], newData[fdk], file)) {
        errors.push({ fileName: file, error: 'value is missing a template or has an extra template', key: fdk, defaultValue: originalData[fdk], value: newData[fdk] })
      }
    }
  })
}

/**
 *
 * @param {String} defaultValue
 * @param {String} otherValue
 */
function isMissingInterpolation(defaultValue, otherValue, filename) {
  if (otherValue === '') {
    // not translated yet, we don't care
    return false
  }
  const defaultMatches = defaultValue.match(/{[^}]*}/g)
  const otherMatches = otherValue.match(/{[^}]*}/g)

  if (defaultMatches) {
    if (!otherMatches) {
      // no templates found.
      return true
    }
    defaultMatches.sort()
    otherMatches.sort()

    const defaultMatchesStringified = JSON.stringify(defaultMatches)
    const otherMatchesStringified = JSON.stringify(otherMatches)
    if (defaultMatchesStringified !== otherMatchesStringified) {
      console.log({
        file1: { content: defaultMatchesStringified, file: 'en-US.yaml' },
        file2: { content: otherMatchesStringified, file: filename }
      })
    }
    // check if templates match.
    return defaultMatchesStringified !== otherMatchesStringified
  } else if (otherMatches) {
    // extra template found
    return true
  }
}
