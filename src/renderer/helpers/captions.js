/**
 * @param {Promise[] | object[]} captionHybridList
 * @param {string} currentLocale
 */
export async function transformCaptions(captionHybridList, currentLocale) {
  let captionList
  if (captionHybridList[0] instanceof Promise) {
    captionList = await Promise.all(captionHybridList)
  } else {
    captionList = captionHybridList
  }

  return sortCaptions(captionList, currentLocale)
}

/**
 * @param {object[]} captionList
 * @param {string} currentLocale
 */
function sortCaptions(captionList, currentLocale) {
  return captionList.sort((captionA, captionB) => {
    const aCode = captionA.language_code.split('-') // ex. [en,US]
    const bCode = captionB.language_code.split('-')
    const aName = (captionA.label) // ex: english (auto-generated)
    const bName = (captionB.label)
    const userLocale = currentLocale.split('-') // ex. [en,US]
    if (aCode[0] === userLocale[0]) { // caption a has same language as user's locale
      if (bCode[0] === userLocale[0]) { // caption b has same language as user's locale
        if (bName.search('auto') !== -1) {
          // prefer caption a: b is auto-generated captions
          return -1
        } else if (aName.search('auto') !== -1) {
          // prefer caption b: a is auto-generated captions
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
    return aName.localeCompare(bName, currentLocale)
  })
}
