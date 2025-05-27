const { readFileSync, readdirSync } = require('fs')
const { join } = require('path')

function getPreloadedLocales() {
  const localesFile = readFileSync(join(__dirname, '../node_modules/shaka-player/dist/locales.js'), 'utf-8')

  const localesLine = localesFile.match(/^\/\/ LOCALES: ([\w ,-]+)$/m)

  if (!localesLine) {
    throw new Error("Failed to parse shaka-player's preloaded locales")
  }

  return localesLine[1].split(',').map(locale => locale.trim())
}

function getAllLocales() {
  const filenames = readdirSync(join(__dirname, '../node_modules/shaka-player/ui/locales'))

  return new Set(filenames
    .filter(filename => filename !== 'source.json' && filename.endsWith('.json'))
    .map(filename => filename.replace('.json', '')))
}

/**
 * Maps the shaka locales to FreeTube's active ones
 * This allows us to know which locale files are actually needed
 * and which shaka locale needs to be activated for a given FreeTube one.
 * @param {Set<string>} shakaLocales
 * @param {string[]} freeTubeLocales
 */
function getMappings(shakaLocales, freeTubeLocales) {
  /**
   * @type {[string, string][]}
   * Using this structure as it gets passed to `new Map()` in the player component
   * The first element is the FreeTube locale, the second one is the shaka-player one
   */
  const mappings = []

  for (const locale of freeTubeLocales) {
    if (shakaLocales.has(locale)) {
      mappings.push([
        locale,
        locale
      ])
    } else if (shakaLocales.has(locale.split('-')[0])) {
      mappings.push([
        locale,
        locale.split('-')[0]
      ])
    }
  }

  // special cases

  mappings.push(
    // according to https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    // "no" is the macro language for "nb" and "nn"
    [
      'nb-NO',
      'no'
    ],
    [
      'nn',
      'no'
    ],

    // according to https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    // "iw" is the old/original code for Hebrew, these days it's "he"
    [
      'he',
      'iw'
    ],

    // not sure why we have pt, pt-PT and pt-BR in the FreeTube locales
    // as pt and pt-PT are the same thing, but we should handle it here anyway
    [
      'pt',
      'pt-PT'
    ]
  )

  return mappings
}

function getShakaLocales() {
  const shakaLocales = getAllLocales()

  /** @type {string[]} */
  const freeTubeLocales = JSON.parse(readFileSync(join(__dirname, '../static/locales/activeLocales.json'), 'utf-8'))

  const mappings = getMappings(shakaLocales, freeTubeLocales)

  const preloaded = getPreloadedLocales()

  const shakaMappings = mappings.map(mapping => mapping[1])

  // use a set to deduplicate the list
  // we don't need to bundle any locale files that are already embedded in shaka-player/preloaded

  /** @type {string[]} */
  const toBeBundled = [...new Set(shakaMappings.filter(locale => !preloaded.includes(locale)))]

  return {
    SHAKA_LOCALE_MAPPINGS: mappings,
    SHAKA_LOCALES_PREBUNDLED: preloaded,
    SHAKA_LOCALES_TO_BE_BUNDLED: toBeBundled
  }
}

module.exports = getShakaLocales()
