export const colorNames = [
  'Red',
  'Pink',
  'Purple',
  'DeepPurple',
  'Indigo',
  'Blue',
  'LightBlue',
  'Cyan',
  'Teal',
  'Green',
  'LightGreen',
  'Lime',
  'Yellow',
  'Amber',
  'Orange',
  'DeepOrange',
  'DraculaCyan',
  'DraculaGreen',
  'DraculaOrange',
  'DraculaPink',
  'DraculaPurple',
  'DraculaRed',
  'DraculaYellow',
  'CatppuccinMochaRosewater',
  'CatppuccinMochaFlamingo',
  'CatppuccinMochaPink',
  'CatppuccinMochaMauve',
  'CatppuccinMochaRed',
  'CatppuccinMochaMaroon',
  'CatppuccinMochaPeach',
  'CatppuccinMochaYellow',
  'CatppuccinMochaGreen',
  'CatppuccinMochaTeal',
  'CatppuccinMochaSky',
  'CatppuccinMochaSapphire',
  'CatppuccinMochaBlue',
  'CatppuccinMochaLavender'
]

export const colorValues = [
  '#d50000',
  '#C51162',
  '#AA00FF',
  '#6200EA',
  '#304FFE',
  '#2962FF',
  '#0091EA',
  '#00B8D4',
  '#00BFA5',
  '#00C853',
  '#64DD17',
  '#AEEA00',
  '#FFD600',
  '#FFAB00',
  '#FF6D00',
  '#DD2C00',
  '#8BE9FD',
  '#50FA7B',
  '#FFB86C',
  '#FF79C6',
  '#BD93F9',
  '#FF5555',
  '#F1FA8C',
  '#F5E0DC',
  '#F2CDCD',
  '#F5C2E7',
  '#CBA6F7',
  '#F38BA8',
  '#EBA0AC',
  '#FAB387',
  '#F9E2AF',
  '#A6E3A1',
  '#94E2D5',
  '#89DCEB',
  '#74C7EC',
  '#89B4FA',
  '#B4BEFE'
]

export function getRandomColorClass() {
  const randomInt = Math.floor(Math.random() * colorNames.length)
  return 'main' + colorNames[randomInt]
}

export function getRandomColor() {
  const randomInt = Math.floor(Math.random() * colorValues.length)
  return colorValues[randomInt]
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

export function calculatePublishedDate(publishedText) {
  const date = new Date()
  if (publishedText === 'Live') {
    return publishedText
  }

  const textSplit = publishedText.split(' ')

  if (textSplit[0].toLowerCase() === 'streamed') {
    textSplit.shift()
  }

  const timeFrame = textSplit[1]
  const timeAmount = parseInt(textSplit[0])
  let timeSpan = null

  if (timeFrame.indexOf('second') > -1) {
    timeSpan = timeAmount * 1000
  } else if (timeFrame.indexOf('minute') > -1) {
    timeSpan = timeAmount * 60000
  } else if (timeFrame.indexOf('hour') > -1) {
    timeSpan = timeAmount * 3600000
  } else if (timeFrame.indexOf('day') > -1) {
    timeSpan = timeAmount * 86400000
  } else if (timeFrame.indexOf('week') > -1) {
    timeSpan = timeAmount * 604800000
  } else if (timeFrame.indexOf('month') > -1) {
    timeSpan = timeAmount * 2592000000
  } else if (timeFrame.indexOf('year') > -1) {
    timeSpan = timeAmount * 31556952000
  }

  return date.getTime() - timeSpan
}

export function buildVTTFileLocally(storyboard) {
  let vttString = 'WEBVTT\n\n'
  // how many images are in one image
  const numberOfSubImagesPerImage = storyboard.sWidth * storyboard.sHeight
  // the number of storyboard images
  const numberOfImages = Math.ceil(storyboard.count / numberOfSubImagesPerImage)
  const intervalInSeconds = storyboard.interval / 1000
  let currentUrl = storyboard.url
  let startHours = 0
  let startMinutes = 0
  let startSeconds = 0
  let endHours = 0
  let endMinutes = 0
  let endSeconds = intervalInSeconds
  for (let i = 0; i < numberOfImages; i++) {
    let xCoord = 0
    let yCoord = 0
    for (let j = 0; j < numberOfSubImagesPerImage; j++) {
      // add the timestamp information
      const paddedStartHours = startHours.toString().padStart(2, '0')
      const paddedStartMinutes = startMinutes.toString().padStart(2, '0')
      const paddedStartSeconds = startSeconds.toString().padStart(2, '0')
      const paddedEndHours = endHours.toString().padStart(2, '0')
      const paddedEndMinutes = endMinutes.toString().padStart(2, '0')
      const paddedEndSeconds = endSeconds.toString().padStart(2, '0')
      vttString += `${paddedStartHours}:${paddedStartMinutes}:${paddedStartSeconds}.000 --> ${paddedEndHours}:${paddedEndMinutes}:${paddedEndSeconds}.000\n`
      // add the current image url as well as the x, y, width, height information
      vttString += currentUrl + `#xywh=${xCoord},${yCoord},${storyboard.width},${storyboard.height}\n\n`
      // update the variables
      startHours = endHours
      startMinutes = endMinutes
      startSeconds = endSeconds
      endSeconds += intervalInSeconds
      if (endSeconds >= 60) {
        endSeconds -= 60
        endMinutes += 1
      }
      if (endMinutes >= 60) {
        endMinutes -= 60
        endHours += 1
      }
      // x coordinate can only be smaller than the width of one subimage * the number of subimages per row
      xCoord = (xCoord + storyboard.width) % (storyboard.width * storyboard.sWidth)
      // only if the x coordinate is , so in a new row, we have to update the y coordinate
      if (xCoord === 0) {
        yCoord += storyboard.height
      }
    }
    // make sure that there is no value like M0 or M1 in the parameters that gets replaced
    currentUrl = currentUrl.replace('M' + i.toString() + '.jpg', 'M' + (i + 1).toString() + '.jpg')
  }
  return vttString
}
