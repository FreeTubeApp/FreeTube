// Based on https://github.com/shaka-project/shaka-player/blob/main/lib/dash/webm_segment_index_parser.js
// Adapted for use in FreeTube:
// - General changes such as removing Closure compiler specific stuff
// - Rewritten to use functions instead of a class
// - The segment URLs receive the start time and segment number

import shaka from 'shaka-player'
import { EbmlParser } from './EbmlParser'

const EBML_ID = 0x1a45dfa3
const SEGMENT_ID = 0x18538067
const INFO_ID = 0x1549a966
const TIMECODE_SCALE_ID = 0x2ad7b1
const DURATION_ID = 0x4489
const CUES_ID = 0x1c53bb6b
const CUE_POINT_ID = 0xbb
const CUE_TIME_ID = 0xb3
const CUE_TRACK_POSITIONS_ID = 0xb7
const CUE_CLUSTER_POSITION = 0xf1

const ShakaError = shaka.util.Error
const SeverityCritical = ShakaError.Severity.CRITICAL
const CategoryMedia = ShakaError.Category.MEDIA

/**
 * Parses SegmentReferences from a WebM container.
 * @param {BufferSource} cuesData The WebM container's "Cueing Data" section.
 * @param {BufferSource} initData The WebM container's headers.
 * @param {string} uri The location of the WebM file that contains the segments.
 * @param {shaka.media.InitSegmentReference} initSegmentReference
 * @param {number} timestampOffset
 * @param {number} appendWindowStart
 * @param {number} appendWindowEnd
 * @returns {shaka.media.SegmentReference[]}
 * @see http://www.matroska.org/technical/specs/index.html
 * @see http://www.webmproject.org/docs/container/
 */
export function parseWebmSegmentIndex(
  cuesData,
  initData,
  uri,
  initSegmentReference,
  timestampOffset,
  appendWindowStart,
  appendWindowEnd
) {
  const tuple = /** @__NOINLINE__ */ parseWebmContainer(initData)
  const parser = new EbmlParser(cuesData)
  const cuesElement = parser.parseElement()
  if (cuesElement.id !== CUES_ID) {
    console.error('[parseWebmSegmentIndex] Not a Cues element.')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.WEBM_CUES_ELEMENT_MISSING
    )
  }

  return /** @__NOINLINE__ */ parseCues(
    cuesElement,
    tuple.segmentOffset,
    tuple.timecodeScale,
    tuple.duration,
    uri,
    initSegmentReference,
    timestampOffset,
    appendWindowStart,
    appendWindowEnd
  )
}

/**
 * Parses a WebM container to get the segment's offset, timecode scale, and
 * duration.
 *
 * @param {BufferSource} initData
 * @returns {{segmentOffset: number, timecodeScale: number, duration: number}}
 *   The segment's offset in bytes, the segment's timecode scale in seconds,
 *   and the duration in seconds.
 */
function parseWebmContainer(initData) {
  const parser = new EbmlParser(initData)

  // Check that the WebM container data starts with the EBML header, but
  // skip its contents.
  const ebmlElement = parser.parseElement()
  if (ebmlElement.id !== EBML_ID) {
    console.error('Not an EBML element.')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.WEBM_EBML_HEADER_ELEMENT_MISSING
    )
  }

  const segmentElement = parser.parseElement()
  if (segmentElement.id !== SEGMENT_ID) {
    console.error('[parseWebmSegmentIndex] Not a Segment element.')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.WEBM_SEGMENT_ELEMENT_MISSING
    )
  }

  // This value is used as the initial offset to the first referenced segment.
  const segmentOffset = segmentElement.getOffset()

  // Parse the Segment element to get the segment info.
  const segmentInfo = /** @__NOINLINE__ */ parseSegment(segmentElement)
  return {
    segmentOffset: segmentOffset,
    timecodeScale: segmentInfo.timecodeScale,
    duration: segmentInfo.duration,
  }
}

/**
 * Parses a WebM Info element to get the segment's timecode scale and
 * duration.
 * @param {import('./EbmlParser').EbmlElement} segmentElement
 * @returns {{timecodeScale: number, duration: number}} The segment's timecode
 *   scale in seconds and duration in seconds.
 */
function parseSegment(segmentElement) {
  const parser = segmentElement.createParser()

  // Find the Info element.
  let infoElement = null
  while (parser.hasMoreData()) {
    const elem = parser.parseElement()
    if (elem.id !== INFO_ID) {
      continue
    }

    infoElement = elem

    break
  }

  if (!infoElement) {
    console.error('[parseWebmSegmentIndex] Not an Info element.')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.WEBM_INFO_ELEMENT_MISSING
    )
  }

  return /** @__NOINLINE__ */ parseInfo(infoElement)
}

/**
 * Parses a WebM Info element to get the segment's timecode scale and
 * duration.
 * @param {import('./EbmlParser').EbmlElement} infoElement
 * @returns {{timecodeScale: number, duration: number}} The segment's timecode
 *   scale in seconds and duration in seconds.
 */
function parseInfo(infoElement) {
  const parser = infoElement.createParser()

  // The timecode scale factor in units of [nanoseconds / T], where [T] are
  // the units used to express all other time values in the WebM container.
  // By default it's assumed that [T] == [milliseconds].
  let timecodeScaleNanoseconds = 1000000
  /** @type {?number} */
  let durationScale = null

  while (parser.hasMoreData()) {
    const elem = parser.parseElement()
    if (elem.id === TIMECODE_SCALE_ID) {
      timecodeScaleNanoseconds = elem.getUint()
    } else if (elem.id === DURATION_ID) {
      durationScale = elem.getFloat()
    }
  }
  if (durationScale == null) {
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.WEBM_DURATION_ELEMENT_MISSING
    )
  }

  // The timecode scale factor in units of [seconds / T].
  const timecodeScale = timecodeScaleNanoseconds / 1000000000
  // The duration is stored in units of [T]
  const durationSeconds = durationScale * timecodeScale

  return { timecodeScale: timecodeScale, duration: durationSeconds }
}

/**
 * Parses a WebM CuesElement.
 * @param {import('./EbmlParser').EbmlElement} cuesElement
 * @param {number} segmentOffset
 * @param {number} timecodeScale
 * @param {number} duration
 * @param {string} uri
 * @param {shaka.media.InitSegmentReference} initSegmentReference
 * @param {number} timestampOffset
 * @param {number} appendWindowStart
 * @param {number} appendWindowEnd
 * @returns {shaka.media.SegmentReference[]}
 */
function parseCues(
  cuesElement,
  segmentOffset,
  timecodeScale,
  duration,
  uri,
  initSegmentReference,
  timestampOffset,
  appendWindowStart,
  appendWindowEnd
) {
  const references = []

  const parser = cuesElement.createParser()

  let lastTime = null
  let lastOffset = null
  let sq = 1

  while (parser.hasMoreData()) {
    const elem = parser.parseElement()
    if (elem.id !== CUE_POINT_ID) {
      continue
    }

    const tuple = parseCuePoint(elem)
    if (!tuple) {
      continue
    }

    // Subtract the presentation time offset from the unscaled time
    const currentTime = timecodeScale * tuple.unscaledTime
    const currentOffset = segmentOffset + tuple.relativeOffset

    if (lastTime != null) {
      if (process.env.NODE_ENV === 'development' && lastOffset == null) {
        throw new Error('Assertion failure: last offset cannot be null')
      }

      const uris = [`${uri}&startTimeMs=${Math.round((lastTime + timestampOffset) * 1000)}&sq=${sq++}`]

      references.push(
        new shaka.media.SegmentReference(
          lastTime + timestampOffset,
          currentTime + timestampOffset,
          () => uris,
          /* startByte= */ lastOffset, /* endByte= */ currentOffset - 1,
          initSegmentReference,
          timestampOffset,
          appendWindowStart,
          appendWindowEnd
        )
      )
    }

    lastTime = currentTime
    lastOffset = currentOffset
  }

  if (lastTime != null) {
    if (process.env.NODE_ENV === 'development' && lastOffset == null) {
      throw new Error('Assertion failure: last offset cannot be null')
    }

    const uris = [`${uri}&startTimeMs=${Math.round((lastTime + timestampOffset) * 1000)}&sq=${sq}`]

    references.push(
      new shaka.media.SegmentReference(
        lastTime + timestampOffset,
        duration + timestampOffset,
        () => uris,
        /* startByte= */ lastOffset, /* endByte= */ null,
        initSegmentReference,
        timestampOffset,
        appendWindowStart,
        appendWindowEnd
      )
    )
  }

  return references
}

/**
 * Parses a WebM CuePointElement to get an "unadjusted" segment reference.
 * @param {import('./EbmlParser').EbmlElement} cuePointElement
 * @returns {{unscaledTime: number, relativeOffset: number}} The referenced
 *   segment's start time in units of [T] (see parseInfo_()), and the
 *   referenced segment's offset in bytes, relative to a WebM Segment
 *   element.
 */
function parseCuePoint(cuePointElement) {
  const parser = cuePointElement.createParser()

  // Parse CueTime element.
  const cueTimeElement = parser.parseElement()
  if (cueTimeElement.id !== CUE_TIME_ID) {
    console.warn('[parseWebmSegmentIndex] Not a CueTime element.')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.WEBM_CUE_TIME_ELEMENT_MISSING
    )
  }
  const unscaledTime = cueTimeElement.getUint()

  // Parse CueTrackPositions element.
  const cueTrackPositionsElement = parser.parseElement()
  if (cueTrackPositionsElement.id !== CUE_TRACK_POSITIONS_ID) {
    console.warn('[parseWebmSegmentIndex] Not a CueTrackPositions element.')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.WEBM_CUE_TRACK_POSITIONS_ELEMENT_MISSING
    )
  }

  const cueTrackParser = cueTrackPositionsElement.createParser()
  let relativeOffset = 0

  while (cueTrackParser.hasMoreData()) {
    const elem = cueTrackParser.parseElement()
    if (elem.id !== CUE_CLUSTER_POSITION) {
      continue
    }

    relativeOffset = elem.getUint()
    break
  }

  return { unscaledTime: unscaledTime, relativeOffset: relativeOffset }
}
