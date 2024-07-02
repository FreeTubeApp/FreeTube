import shaka from 'shaka-player'

const ShakaCue = shaka.text.Cue

/**
 * Creates a shaka Cue from a browser native VTTCue
 * including parsing the karake style text, styling information and unescaping the text.
 *
 * Please note this is designed specifically to parse YouTube's VTT files
 * and makes some assumptions that won't be applicable to other VTT files.
 * E.g. that the class names always refer to colours, as the actual CSS that the class name points to,
 * isn't accessible through the VTTCues. It's the only way (as far as I can tell) to support coloured text,
 * without parsing the VTT file to extract the style section.
 *
 * The only tag this currently doesn't parse, is the voice (`<v>`) one, as I wasn't able to find a video with them.
 * @param {VTTCue} vttCue
 */
export function shakaCueFromVTTCue(vttCue) {
  // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#cue_payload_text_tags
  // https://w3c.github.io/webvtt

  // strip the voice tags as we don't support them yet
  /** @type {string} */
  const text = vttCue.text.replaceAll(/<(?:v(?:[\t .][^>]+)?|\/v)>/g, '')

  // if the text doesn't contain any tags, we can bypass all the parsing and directly return a Cue
  if (!text.includes('<')) {
    const shakaCue = new ShakaCue(vttCue.startTime, vttCue.endTime, replaceCueTextEscapeSequences(text))

    copyFromVttCueToShakaCue(vttCue, shakaCue)

    return shakaCue
  }

  const nestedCues = []

  const TIME_TAG_REGEX = /(?:(?<hours>\d{2,}):)?(?<minutes>\d{2}):(?<seconds>\d{2}\.\d{3})/

  let currentStartTime = vttCue.startTime
  let currentText = ''
  /** @type {string|null} */
  let currentColor = null
  let bold = false
  let italic = false
  let underline = false

  let ruby = false
  let rubyRt = false

  let inTag = false
  let tagText = ''

  const createCueWithCurrentConfig = () => {
    /** @type {'rt'|'ruby'|null} */
    let rubyTag = null

    if (rubyRt) {
      rubyTag = 'rt'
    } else if (ruby) {
      rubyTag = 'ruby'
    }

    const cue = createFormattedShakaCue(currentStartTime, vttCue.endTime, currentText, bold, italic, underline, currentColor, rubyTag)

    currentText = ''

    return cue
  }

  for (let i = 0; i < text.length; i++) {
    const character = text.charAt(i)

    if (inTag) {
      if (character === '>') {
        if (currentText.length > 0) {
          nestedCues.push(createCueWithCurrentConfig())
        }

        switch (tagText) {
          case 'b':
            bold = true
            break
          case '/b':
            bold = false
            break
          case 'i':
            italic = true
            break
          case '/i':
            italic = false
            break
          case 'u':
            underline = true
            break
          case '/u':
            underline = false
            break
          case 'ruby':
            ruby = true
            break
          case '/ruby':
            ruby = false
            break
          case 'rt':
            rubyRt = true
            break
          case '/rt':
            rubyRt = false
            break
          case '/c':
            currentColor = null
            break
          default:
            if (tagText.charAt(0) === 'c') {
              // examples
              // <c></c>
              // <c.yellow></c>
              // <c.colorA0AAB4></c>
              currentColor = tagText.substring(2)
            } else {
              const match = tagText.match(TIME_TAG_REGEX)

              if (match) {
                let startSeconds = parseFloat(match.groups.seconds)
                startSeconds += parseInt(match.groups.minutes) * 60

                if (match.groups.hours) {
                  startSeconds += parseInt(match.groups.hours) * 60 * 60
                }

                currentStartTime = startSeconds
              }
            }

            break
        }

        inTag = false
        tagText = ''
      } else {
        tagText += character
      }
    } else if (character === '<') {
      inTag = true

      if (currentText.length > 0) {
        nestedCues.push(createCueWithCurrentConfig())
      }

      // create cue with current settings
    } else if (character === '\n') {
      const cue = createCueWithCurrentConfig()

      const lineBreakCue = new ShakaCue(currentStartTime, vttCue.endTime, '')
      lineBreakCue.lineBreak = true

      nestedCues.push(cue, lineBreakCue)
    } else {
      currentText += character
    }
  }

  if (currentText.length > 0) {
    nestedCues.push(createCueWithCurrentConfig())
  }

  const shakaCue = new ShakaCue(vttCue.startTime, vttCue.endTime, '')

  copyFromVttCueToShakaCue(vttCue, shakaCue)

  shakaCue.nestedCues = nestedCues

  return shakaCue
}

/**
 * @param {number} startTime
 * @param {number} endTime
 * @param {string} text
 * @param {boolean} bold
 * @param {boolean} italic
 * @param {boolean} underline
 * @param {string|null} color
 * @param {'ruby'|'rt'|null} rubyTag
 */
function createFormattedShakaCue(startTime, endTime, text, bold, italic, underline, color, rubyTag) {
  const cue = new ShakaCue(startTime, endTime, replaceCueTextEscapeSequences(text))

  if (bold) {
    cue.fontWeight = ShakaCue.fontWeight.BOLD
  }

  if (italic) {
    cue.fontStyle = ShakaCue.fontStyle.ITALIC
  }

  if (underline) {
    cue.textDecoration = [ShakaCue.textDecoration.UNDERLINE]
  }

  if (color !== null && color.length > 0) {
    // even though we can't directly access the style section in the vtt file
    // YouTube uses predictable class names for their colour classes:
    // either the name of a colour e.g. "c.yellow" or the hex values e.g. "c.colorEEEEEE"
    // (I checked the style section in one of their VTT files to verify that)

    if (color.startsWith('color')) {
      cue.color = color.replace('color', '#')
    } else {
      cue.color = color
    }
  }

  if (rubyTag !== null) {
    cue.rubyTag = rubyTag
  }

  return cue
}

/**
 * @param {VTTCue} vttCue
 * @param {shaka.text.Cue} shakaCue
 */
function copyFromVttCueToShakaCue(vttCue, shakaCue) {
  shakaCue.lineAlign = vttCue.lineAlign ?? ShakaCue.lineAlign.START
  shakaCue.positionAlign = vttCue.positionAlign ?? ShakaCue.positionAlign.AUTO
  shakaCue.size = vttCue.size
  shakaCue.textAlign = vttCue.align

  switch (vttCue.vertical) {
    case '':
      shakaCue.writingMode = ShakaCue.writingMode.HORIZONTAL_TOP_TO_BOTTOM
      break
    case 'lr':
      shakaCue.writingMode = ShakaCue.writingMode.VERTICAL_LEFT_TO_RIGHT
      break
    case 'rl':
      shakaCue.writingMode = ShakaCue.writingMode.VERTICAL_RIGHT_TO_LEFT
      break
  }

  shakaCue.lineInterpretation = vttCue.snapToLines ? ShakaCue.lineInterpretation.LINE_NUMBER : ShakaCue.lineInterpretation.PERCENTAGE

  shakaCue.line = vttCue.line === 'auto' ? null : vttCue.line
  shakaCue.position = vttCue.position === 'auto' ? null : vttCue.position

  // only available in Firefox at the moment, but we might as well copy it, when it's there
  if (vttCue.region) {
    const shakaRegion = shakaCue.region

    shakaRegion.id = vttCue.region.id
    shakaRegion.viewportAnchorX = vttCue.region.viewportAnchorX
    shakaRegion.viewportAnchorY = vttCue.region.viewportAnchorY
    shakaRegion.regionAnchorX = vttCue.region.regionAnchorX
    shakaRegion.regionAnchorY = vttCue.region.regionAnchorY
    shakaRegion.width = vttCue.region.width
    shakaRegion.height = vttCue.region.lines
    shakaRegion.heightUnits = shaka.text.CueRegion.units.LINES
    shakaRegion.scroll = vttCue.region.scroll
  }
}

/**
 * @param {string} text
 * @returns {string}
 */
function replaceCueTextEscapeSequences(text) {
  return text.replaceAll(/&(amp|lt|gt|lrm|rlm|nbsp);/g, escapeSequenceReplacer)
}

/**
 * @param {string} _match
 * @param {string} sequence
 * @returns {string}
 */
function escapeSequenceReplacer(_match, sequence) {
  switch (sequence) {
    case 'amp':
      return '&'
    case 'lt':
      return '<'
    case 'gt':
      return '>'
    case 'lrm':
      return '\u200E'
    case 'rlm':
      return '\u200F'
    case 'nbsp':
      return '\u00A0'
  }
}
