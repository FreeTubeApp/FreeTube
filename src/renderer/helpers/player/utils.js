import shaka from 'shaka-player'
import { deepCopy } from '../utils'
import i18n from '../../i18n/index'
import { sponsorBlockSkipSegments } from '../sponsorblock'

/** @typedef {import('../sponsorblock').SponsorBlockCategory} SponsorBlockCategory */

/**
 * @param {shaka.util.Error} error
 * @param {string} context
 * @param {string} videoId
 * @param {object?} details
 */
export function logShakaError(error, context, videoId, details) {
  const { Severity, Category, Code } = shaka.util.Error

  // shaka's error type also has a message property but that is apparently only available in uncompiled mode

  /** @type {keyof Severity} */
  const severityText = Object.keys(Severity).find((/** @type {keyof Severity} */ key) => Severity[key] === error.severity)

  /** @type {keyof Category} */
  const categoryText = Object.keys(Category).find((/** @type {keyof Category} */ key) => Category[key] === error.category)

  /** @type {keyof Code} */
  const codeText = Object.keys(Code).find((/** @type {keyof Code} */ key) => Code[key] === error.code)

  const message =
    'Player Error (category and code explainations here: https://shaka-player-demo.appspot.com/docs/api/shaka.util.Error.html)\n' +
    `Video ID: "${videoId}"\n` +
    `FreeTube player context: "${context}"\n\n` +
    `Severity: ${severityText} (${error.severity})\n` +
    `Category: ${categoryText} (${error.category})\n` +
    `Code: ${codeText} (${error.code})\n` +
    `Stack trace:\n${error.stack}`

  /** @type {*[]} */
  const args = [message]

  if (error.data && error.data.length > 0) {
    args.push(
      '\n\nshaka-player Data:',
      error.data
    )
  }

  if (details) {
    args.push(
      '\n\nFreeTube data:',
      // use deepCopy to get rid of Vue's proxying,
      // as that requires you click the 3 dots for every property in the logged object to see their values
      // doing it like this, results in a "clean" object where everything is immediately visible
      typeof details === 'object' ? deepCopy(details) : details
    )
  }

  console.error(...args)
}

/**
 * @param {string} videoId
 * @param {SponsorBlockCategory[]} categories
 */
export async function getSponsorBlockSegments(videoId, categories) {
  const segments = await sponsorBlockSkipSegments(videoId, categories)

  if (segments.length === 0) {
    return {
      segments: [],
      averageDuration: 0
    }
  }

  const averageDuration = segments.reduce((accumulator, segment) => {
    return accumulator + segment.videoDuration
  }, 0) / segments.length

  const mappedSegments = segments.map(({ category, segment: [startTime, endTime], UUID }) => {
    return {
      uuid: UUID,
      category,
      startTime,
      endTime
    }
  })

  mappedSegments.sort((a, b) => a.startTime - b.startTime)

  return {
    segments: mappedSegments,
    averageDuration
  }
}

/**
 * @param {SponsorBlockCategory} category
 */
export function translateSponsorBlockCategory(category) {
  switch (category) {
    case 'sponsor':
      return i18n.t('Video.Sponsor Block category.sponsor')
    case 'intro':
      return i18n.t('Video.Sponsor Block category.intro')
    case 'outro':
      return i18n.t('Video.Sponsor Block category.outro')
    case 'recap':
      return i18n.t('Video.Sponsor Block category.recap')
    case 'selfpromo':
      return i18n.t('Video.Sponsor Block category.self-promotion')
    case 'interaction':
      return i18n.t('Video.Sponsor Block category.interaction')
    case 'music_offtopic':
      return i18n.t('Video.Sponsor Block category.music offtopic')
    case 'filler':
      return i18n.t('Video.Sponsor Block category.filler')
    default:
      console.error(`Unknown translation for SponsorBlock category ${category}`)
      return category
  }
}

/**
 * Moves the captions that are the most similar to the display language to the top
 * and sorts the remaining ones alphabetically.
 * @param {{
 *   url: string,
 *   label: string,
 *   language: string,
 *   mimeType: string,
 *   isAutotranslated?: boolean
 * }[]} captions
 */
export function sortCaptions(captions) {
  const currentLocale = i18n.locale
  const userLocale = currentLocale.split('-') // ex. [en,US]

  const collator = new Intl.Collator([currentLocale, 'en'])

  return captions.slice().sort((captionA, captionB) => {
    const aCode = captionA.language.split('-') // ex. [en,US] or [en]
    const bCode = captionB.language.split('-')
    const aName = captionA.label // ex: english (auto-generated)
    const bName = captionB.label
    const aIsAutotranslated = !!captionA.isAutotranslated
    const bIsAutotranslated = !!captionB.isAutotranslated
    if (aCode[0] === userLocale[0]) { // caption a has same language as user's locale
      if (bCode[0] === userLocale[0]) { // caption b has same language as user's locale
        if (bName.includes('auto')) {
          // prefer caption a: b is auto-generated captions
          return -1
        } else if (aName.includes('auto')) {
          // prefer caption b: a is auto-generated captions
          return 1
        } else if (bIsAutotranslated) {
          // prefer caption a: b is auto-translated captions
          return -1
        } else if (aIsAutotranslated) {
          // prefer caption b: a is auto-translated captions
          return 1
        } else if (aCode[1] === userLocale[1]) {
          // prefer caption a: caption a has same county code as user's locale
          return -1
        } else if (bCode[1] === userLocale[1]) {
          // prefer caption b: caption b has same county code as user's locale
          return 1
        } else if (aCode[1] === undefined) {
          // prefer caption a: no country code is better than wrong country code
          return -1
        } else if (bCode[1] === undefined) {
          // prefer caption b: no country code is better than wrong country code
          return 1
        }
      } else {
        // prefer caption a: b does not match user's language
        return -1
      }
    } else if (bCode[0] === userLocale[0]) {
      // prefer caption b: a does not match user's language
      return 1
    }
    // sort alphabetically
    return collator.compare(aName, bName)
  })
}

/**
 * When the build doesn't support the local API
 * we have to use Invidious' DASH manifest, instead of generating our own one.
 * This function cleans it up, so that we can use it.
 *
 * Here is a list of things this function does:
 * - Removes bogus roles and labels
 * - Extracts the languages from the audio URLs if available and adds it to the adapation sets
 * - Adds roles and labels when possible to add support for multiple audio tracks
 *
 * Things this function does not do:
 * - Separate DRC (Stable Volume) from their original counterparts
 * - Tag HDR video streams (Invidious puts all video streams in the same adaptation set,
 * to tag HDR and SDR streams we would have to separate them out into multiple adaptation sets)
 * @param {shaka.extern.xml.Node[]} periods
 */
export function repairInvidiousManifest(periods) {
  /** @type {shaka.extern.xml.Node[]} */
  const audioAdaptationSets = []

  for (const period of periods) {
    if (Array.isArray(period.children)) {
      for (const periodChild of period.children) {
        if (typeof periodChild !== 'string' && periodChild.tagName === 'AdaptationSet' && periodChild.attributes.mimeType?.startsWith('audio/')) {
          audioAdaptationSets.push(periodChild)
        }
      }
    }
  }

  // match YouTube's local API response with English
  const languageNames = new Intl.DisplayNames('en-US', { type: 'language', languageDisplay: 'standard' })

  for (const audioAdaptationSet of audioAdaptationSets) {
    // Invidious adds a label to every audio stream with it's bitrate
    // we need to remove those labels, so that they don't get treated as multiple audio tracks
    if (audioAdaptationSet.attributes.label) {
      delete audioAdaptationSet.attributes.label
    }

    if (Array.isArray(audioAdaptationSet.children)) {
      // Invidious gives the first audio stream the main role and then the rest of them the alternate role
      // regardless of which one is actually the main track
      const roleIndex = audioAdaptationSet.children.findIndex((adaptationSetChild) => {
        return typeof adaptationSetChild !== 'string' && adaptationSetChild.tagName === 'Role'
      })

      if (roleIndex !== -1) {
        audioAdaptationSet.children.splice(roleIndex, 1)
      }

      // Extract the language and audio content type from the URL if available
      // and add the language, role and label to the adaption set

      /** @type {shaka.extern.xml.Node | undefined} */
      const representation = audioAdaptationSet.children
        .find((child) => typeof child !== 'string' && child.tagName === 'Representation')

      if (representation && Array.isArray(representation.children)) {
        /** @type {string | undefined} */
        const baseUrl = representation.children
          .find((child) => typeof child !== 'string' && child.tagName === 'BaseURL')
          ?.children[0]

        if (baseUrl) {
          const url = new URL(baseUrl.replaceAll('&amp;', '&'))

          if (url.searchParams.has('xtags')) {
            const xtags = url.searchParams.get('xtags').split(':')

            const lang = xtags.find(xtag => xtag.startsWith('lang='))?.replace('lang=', '')
            const audioContent = xtags.find(xtag => xtag.startsWith('acont='))?.replace('acont=', '')

            const labelParts = []

            if (lang) {
              audioAdaptationSet.attributes.lang = lang

              labelParts.push(languageNames.of(lang))
            }

            if (audioContent) {
              let role = ''

              switch (audioContent) {
                case 'original':
                  role = 'main'
                  labelParts.push('original')
                  break
                case 'dubbed':
                case 'dubbed-auto':
                  role = 'dub'
                  break
                case 'descriptive':
                  role = 'description'
                  labelParts.push('descriptive')
                  break
                case 'secondary':
                  role = 'alternate'
                  labelParts.push('secondary')
                  break
                default:
                  role = 'alternate'
                  labelParts.push('alternative')
                  break
              }

              audioAdaptationSet.children.push({
                tagName: 'Role',
                attributes: {
                  schemeIdUri: 'urn:mpeg:dash:role:2011',
                  value: role
                },
                children: [],
                parent: audioAdaptationSet
              })
            }

            if (labelParts.length > 0) {
              audioAdaptationSet.attributes.label = labelParts.join(' ')
            }
          }
        }
      }
    }
  }
}

/**
 * @param {shaka.extern.TrackList} variants
 * @param {number} bandwidthToMatch
 */
export function findMostSimilarAudioBandwidth(variants, bandwidthToMatch) {
  let closestAudioBandwithDifference = Infinity
  let closestVariant

  for (const variant of variants) {
    const difference = Math.abs(variant.audioBandwidth - bandwidthToMatch)

    if (difference < closestAudioBandwithDifference) {
      closestAudioBandwithDifference = difference
      closestVariant = variant
    }
  }

  return closestVariant
}

/**
 * @param {shaka.extern.AudioTrack[]} tracks
 */
export function deduplicateAudioTracks(tracks) {
  /** @type {Map<string, shaka.extern.AudioTrack>} */
  const knownTracks = new Map()

  for (const track of tracks) {
    const id = `${track.label}_${track.language}_${track.channelsCount}_${track.spatialAudio}`

    if (!knownTracks.has(id) || track.active) {
      knownTracks.set(id, track)
    }
  }

  return knownTracks
}
