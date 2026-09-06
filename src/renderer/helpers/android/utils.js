/**
 * @param {string} filePath
 * @param {string} newFileType
 * @returns {string}
 */
export function replaceFileType(filePath, newFileType) {
  return `${filePath.slice(0, filePath.lastIndexOf('.'))}.${newFileType}`
}

/**
 * @typedef ContentResultsInfo
 * @property {string} trimmedContent the original content, trimmed of whitespace
 * @property {boolean} startsLikeJson whether file content appears to be json-like
 * @property {boolean} startsLikeXml whether file content appears to be xml
 * @property {string} fileType the portion of the file path after the last dot
 * @property {boolean} reportsOpml whether or not the file type is 'opml'
 */

/**
 * @typedef ContentResults
 * @property {'db'|'opml'|string} type the determined real file type
 * @property {ContentResultsInfo} info the information which lead to this conclusion
 */

/**
 * detects the real file type of an `octet-stream` mime-typed file in android
 * @param {string} content
 * @param {string} filePath
 * @returns {ContentResults}
 */
export function detectAmbiguousContent(content, filePath) {
  const trimmedContent = content.trim()
  const startsLikeJson = trimmedContent[0] === '{'
  const startsLikeXml = trimmedContent[0] === '<'
  const fileType = filePath.slice(filePath.lastIndexOf('.'), filePath.length)
  const reportsOpml = fileType.endsWith('opml')
  const type = startsLikeJson && reportsOpml
    ? 'db'
    : startsLikeXml && reportsOpml
      ? 'opml'
      : fileType
  return {
    type,
    info: {
      trimmedContent,
      startsLikeJson,
      startsLikeXml,
      fileType,
      reportsOpml
    }
  }
}

/**
 *
 * @param {string} content
 * @param {string} filePath
 * @returns
 */
export function handleAmbigiousContent(content, filePath) {
  const { type, info } = detectAmbiguousContent(content, filePath)
  if (info.fileType !== type) {
    filePath = replaceFileType(filePath, type)
  }
  return filePath
}

export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function isColourDark(colour) {
  if (colour.length < 7) {
    const char = colour.substring(1, 2)
    colour = `${colour.substring(0, 1)}${char}${char}${char}${char}${char}${char}`
  }
  const diffFromWhite = Math.abs(parseInt('FFFFFF', 16) - parseInt(colour.substring(1, colour.length), 16))
  const diffFromBlack = Math.abs(parseInt('000000', 16) - parseInt(colour.substring(1, colour.length), 16))
  return diffFromBlack > diffFromWhite
}

export function reverseObject(object) {
  return Object.fromEntries(
    Object.entries(object)
      .map(([key, value]) => {
        return [value, key]
      })
  )
}

export function versionNumberGt(versionA, versionB) {
  const partsA = `${versionA}`.split('.')
  const partsB = `${versionB}`.split('.')
  if (partsA.length > partsB.length) {
    return true
  } else if (partsB.length > partsA.length) {
    return false
  } else {
    const partComparisons = partsA.map(a => false)
    let oneLeftmostLt = false
    let oneGt = false
    for (let i = 0; i < partsA.length; i++) {
      partComparisons[i] = parseInt(partsA[i]) === parseInt(partsB[i]) ? 'eq' : parseInt(partsA[i]) > parseInt(partsB[i]) ? 'gt' : 'lt'
      if (partComparisons[i] === 'gt') {
        oneGt = true
      }
      if (partComparisons[i] === 'lt' && !oneGt) {
        oneLeftmostLt = true
      }
    }
    const thereIsAGtBeforeALt = !oneLeftmostLt
    return oneGt && thereIsAGtBeforeALt
  }
}
