/**
 * This script updates the files in static/geolocations with the available locations on YouTube.
 *
 * It tries to map every active FreeTube language (static/locales/activelocales.json)
 * to it's equivalent on YouTube.
 *
 * It then uses those language mappings,
 * to scrape the location selection menu on the YouTube website, in every mapped language.
 *
 * All languages it couldn't find on YouTube, that don't have manually added mapping,
 * get logged to the console, as well as all unmapped YouTube languages.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { Innertube, Misc } from 'youtubei.js'

const STATIC_DIRECTORY = `${dirname(fileURLToPath(import.meta.url))}/../static`

const activeLanguagesPath = `${STATIC_DIRECTORY}/locales/activeLocales.json`
/** @type {string[]} */
const activeLanguages = JSON.parse(readFileSync(activeLanguagesPath, { encoding: 'utf8' }))

// en-US is en on YouTube
const initialResponse = await scrapeLanguage('en')

// Scrape language menu in en-US

/** @type {string[]} */
const youTubeLanguages = initialResponse.data.actions[0].openPopupAction.popup.multiPageMenuRenderer.sections[1].multiPageMenuSectionRenderer.items[1].compactLinkRenderer.serviceEndpoint.signalServiceEndpoint.actions[0].getMultiPageMenuAction.menu.multiPageMenuRenderer.sections[0].multiPageMenuSectionRenderer.items
  .map(({ compactLinkRenderer }) => {
    return compactLinkRenderer.serviceEndpoint.signalServiceEndpoint.actions[0].selectLanguageCommand.hl
  })

// map FreeTube languages to their YouTube equivalents

const foundLanguageNames = ['en-US']
const unusedYouTubeLanguageNames = []
const languagesToScrape = []

for (const language of youTubeLanguages) {
  if (activeLanguages.includes(language)) {
    foundLanguageNames.push(language)
    languagesToScrape.push({
      youTube: language,
      freeTube: language
    })
  } else if (activeLanguages.includes(language.replace('-', '_'))) {
    const withUnderScore = language.replace('-', '_')
    foundLanguageNames.push(withUnderScore)
    languagesToScrape.push({
      youTube: language,
      freeTube: withUnderScore
    })
  }
  // special cases
  else if (language === 'de') {
    foundLanguageNames.push('de-DE')
    languagesToScrape.push({
      youTube: 'de',
      freeTube: 'de-DE'
    })
  } else if (language === 'fr') {
    foundLanguageNames.push('fr-FR')
    languagesToScrape.push({
      youTube: 'fr',
      freeTube: 'fr-FR'
    })
  } else if (language === 'no') {
    // according to https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    // "no" is the macro language for "nb" and "nn"
    foundLanguageNames.push('nb_NO', 'nn')
    languagesToScrape.push({
      youTube: 'no',
      freeTube: 'nb_NO'
    })
    languagesToScrape.push({
      youTube: 'no',
      freeTube: 'nn'
    })
  } else if (language !== 'en') {
    unusedYouTubeLanguageNames.push(language)
  }
}

console.log("Active FreeTube languages that aren't available on YouTube:")
console.log(activeLanguages.filter(lang => !foundLanguageNames.includes(lang)).sort())

console.log("YouTube languages that don't have an equivalent active FreeTube language:")
console.log(unusedYouTubeLanguageNames.sort())

// Scrape the location menu in various languages and write files to the file system

rmSync(`${STATIC_DIRECTORY}/geolocations`, { recursive: true })
mkdirSync(`${STATIC_DIRECTORY}/geolocations`)

processGeolocations('en-US', 'en', initialResponse)

for (const { youTube, freeTube } of languagesToScrape) {
  const response = await scrapeLanguage(youTube)

  processGeolocations(freeTube, youTube, response)
}



async function scrapeLanguage(youTubeLanguageCode) {
  const session = await Innertube.create({
    retrieve_player: false,
    generate_session_locally: true,
    lang: youTubeLanguageCode
  })

  return await session.actions.execute('/account/account_menu')
}

function processGeolocations(freeTubeLanguage, youTubeLanguage, response) {
  const geolocations = response.data.actions[0].openPopupAction.popup.multiPageMenuRenderer.sections[1].multiPageMenuSectionRenderer.items[3].compactLinkRenderer.serviceEndpoint.signalServiceEndpoint.actions[0].getMultiPageMenuAction.menu.multiPageMenuRenderer.sections[0].multiPageMenuSectionRenderer.items
    .map(({ compactLinkRenderer }) => {
      return {
        name: new Misc.Text(compactLinkRenderer.title).toString().trim(),
        code: compactLinkRenderer.serviceEndpoint.signalServiceEndpoint.actions[0].selectCountryCommand.gl
      }
    })

  const normalisedFreeTubeLanguage = freeTubeLanguage.replace('_', '-')

  // give Intl.Collator 4 locales, in the hopes that it supports one of them
  // deduplicate the list so it doesn't have to do duplicate work
  const localeSet = new Set()
  localeSet.add(normalisedFreeTubeLanguage)
  localeSet.add(youTubeLanguage)
  localeSet.add(normalisedFreeTubeLanguage.split('-')[0])
  localeSet.add(youTubeLanguage.split('-')[0])

  const locales = Array.from(localeSet)

  // only sort if node supports sorting the language, otherwise hope that YouTube's sorting was correct
  // node 20.3.1 doesn't support sorting `eu`
  if (Intl.Collator.supportedLocalesOf(locales).length > 0) {
    const collator = new Intl.Collator(locales)

    geolocations.sort((a, b) => collator.compare(a.name, b.name))
  }

  writeFileSync(`${STATIC_DIRECTORY}/geolocations/${freeTubeLanguage}.json`, JSON.stringify(geolocations))
}
