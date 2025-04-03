// Based on https://github.com/shaka-project/shaka-player/blob/main/lib/dash/mp4_segment_index_parser.js
// Adapted for use in FreeTube:
// - General changes such as removing Closure compiler specific stuff
// - Rewritten to use functions instead of a class
// - The segment URLs receive the start time and segment number

import shaka from 'shaka-player'

const ShakaError = shaka.util.Error
const SeverityCritical = ShakaError.Severity.CRITICAL
const CategoryMedia = ShakaError.Category.MEDIA

/**
 * Parses SegmentReferences from an ISO BMFF SIDX structure.
 * @param {BufferSource} sidxData The MP4's container's SIDX.
 * @param {number} sidxOffset The SIDX's offset, in bytes, from the start of
 *   the MP4 container.
 * @param {string} uri The location of the MP4 file that contains the segments.
 * @param {shaka.media.InitSegmentReference} initSegmentReference
 * @param {number} timestampOffset
 * @param {number} appendWindowStart
 * @param {number} appendWindowEnd
 * @returns {shaka.media.SegmentReference[]}
 */
export function parseMp4SegmentIndex(
  sidxData,
  sidxOffset,
  uri,
  initSegmentReference,
  timestampOffset,
  appendWindowStart,
  appendWindowEnd
) {
  let references

  const parser = new shaka.util.Mp4Parser()
    .fullBox('sidx', (box) => {
      references = /** @__NOINLINE__ */ parseSIDX(
        sidxOffset,
        initSegmentReference,
        timestampOffset,
        appendWindowStart,
        appendWindowEnd,
        uri,
        box
      )
    })

  if (sidxData) {
    parser.parse(sidxData)
  }

  if (references) {
    return references
  } else {
    console.error('[parseMp4SegmentIndex] Invalid box type, expected "sidx".')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.MP4_SIDX_WRONG_BOX_TYPE
    )
  }
}

/**
 * Parse a SIDX box from the given reader.
 *
 * @param {number} sidxOffset
 * @param {shaka.media.InitSegmentReference} initSegmentReference
 * @param {number} timestampOffset
 * @param {number} appendWindowStart
 * @param {number} appendWindowEnd
 * @param {string} uri The location of the MP4 file that contains the segments.
 * @param {shaka.extern.ParsedBox} box
 * @returns {shaka.media.SegmentReference[]}
 */
function parseSIDX(
  sidxOffset,
  initSegmentReference,
  timestampOffset,
  appendWindowStart,
  appendWindowEnd,
  uri,
  box
) {
  if (process.env.NODE_ENV === 'development' && box.version == null) {
    throw new Error('Assertion failure: SIDX is a full box and should have a valid version.')
  }

  const references = []

  // Parse the SIDX structure.
  // Skip reference_ID (32 bits).
  box.reader.skip(4)

  const timescale = box.reader.readUint32()

  if (timescale === 0) {
    console.error('[parseMp4SegmentIndex] Invalid timescale.')
    throw new ShakaError(
      SeverityCritical,
      CategoryMedia,
      ShakaError.Code.MP4_SIDX_INVALID_TIMESCALE
    )
  }

  let earliestPresentationTime
  let firstOffset

  if (box.version === 0) {
    earliestPresentationTime = box.reader.readUint32()
    firstOffset = box.reader.readUint32()
  } else {
    earliestPresentationTime = box.reader.readUint64()
    firstOffset = box.reader.readUint64()
  }

  // Skip reserved (16 bits).
  box.reader.skip(2)

  // Add references.
  const referenceCount = box.reader.readUint16()

  // Subtract the presentation time offset
  let unscaledStartTime = earliestPresentationTime
  let startByte = sidxOffset + box.size + firstOffset

  for (let i = 0; i < referenceCount; i++) {
    // |chunk| is 1 bit for |referenceType|, and 31 bits for |referenceSize|.
    const chunk = box.reader.readUint32()
    const referenceType = (chunk & 0x80000000) >>> 31
    const referenceSize = chunk & 0x7FFFFFFF

    const subsegmentDuration = box.reader.readUint32()

    // Skipping 1 bit for |startsWithSap|, 3 bits for |sapType|, and 28 bits
    // for |sapDelta|.
    box.reader.skip(4)

    // If |referenceType| is 1 then the reference is to another SIDX.
    // We do not support this.
    if (referenceType === 1) {
      console.error('[parseMp4SegmentIndex] Hierarchical SIDXs are not supported.')
      throw new ShakaError(
        SeverityCritical,
        CategoryMedia,
        ShakaError.Code.MP4_SIDX_TYPE_NOT_SUPPORTED
      )
    }

    // The media timestamps inside the container.
    const nativeStartTime = unscaledStartTime / timescale
    const nativeEndTime =
      (unscaledStartTime + subsegmentDuration) / timescale

    const uris = [`${uri}&startTimeMs=${Math.round((nativeStartTime + timestampOffset) * 1000)}&sq=${i + 1}`]

    references.push(
      new shaka.media.SegmentReference(
        nativeStartTime + timestampOffset,
        nativeEndTime + timestampOffset,
        () => uris,
        startByte,
        startByte + referenceSize - 1,
        initSegmentReference,
        timestampOffset,
        appendWindowStart,
        appendWindowEnd
      )
    )

    unscaledStartTime += subsegmentDuration
    startByte += referenceSize
  }

  box.parser.stop()
  return references
}
