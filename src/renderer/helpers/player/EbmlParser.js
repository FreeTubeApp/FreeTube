// Based on https://github.com/shaka-project/shaka-player/blob/main/lib/dash/ebml_parser.js
// Adapted for use in FreeTube:
// - General changes such as removing Closure compiler specific stuff

import shaka from 'shaka-player'

const ShakaError = shaka.util.Error
const BufferUtils = shaka.util.BufferUtils

export class EbmlParser {
  /**
   * @param {BufferSource} data
   */
  constructor(data) {
    /** @private */
    this.dataView_ = BufferUtils.toDataView(data)

    /** @private */
    this.reader_ = new shaka.util.DataViewReader(this.dataView_, shaka.util.DataViewReader.Endianness.BIG_ENDIAN)
  }

  /**
   * @returns {boolean} True if the parser has more data, false otherwise.
   */
  hasMoreData() {
    return this.reader_.hasMoreData()
  }

  /**
   * Parses an EBML element from the parser's current position, and advances
   * the parser.
   * @returns {EbmlElement} The EBML element.
   * @see http://matroska.org/technical/specs/rfc/index.html
   */
  parseElement() {
    const id = this.parseId_()

    // Parse the element's size.
    const vint = this.parseVint_()
    let size
    if (/** @__NOINLINE__ */isDynamicSizeValue(vint)) {
      // If this has an unknown size, assume that it takes up the rest of the
      // data.
      size = this.dataView_.byteLength - this.reader_.getPosition()
    } else {
      size = /** @__NOINLINE__ */ getVintValue(vint)
    }

    // Note that if the element's size is larger than the buffer then we are
    // parsing a "partial element". This may occur if for example we are
    // parsing the beginning of some WebM container data, but our buffer does
    // not contain the entire WebM container data.
    const elementSize =
      this.reader_.getPosition() + size <= this.dataView_.byteLength
        ? size
        : this.dataView_.byteLength - this.reader_.getPosition()

    const dataView = BufferUtils.toDataView(this.dataView_, this.reader_.getPosition(), elementSize)

    this.reader_.skip(elementSize)

    return new EbmlElement(id, dataView)
  }

  /**
   * Parses an EBML ID from the parser's current position, and advances the
   * parser.
   * @returns {number} The EBML ID.
   * @private
   */
  parseId_() {
    const vint = this.parseVint_()

    if (vint.length > 7) {
      throw new ShakaError(
        ShakaError.Severity.CRITICAL,
        ShakaError.Category.MEDIA,
        ShakaError.Code.EBML_OVERFLOW
      )
    }

    let id = 0
    for (const /* byte */ b of vint) {
      // Note that we cannot use << since |value| may exceed 32 bits.
      id = (256 * id) + b
    }

    return id
  }

  /**
   * Parses a variable sized integer from the parser's current position, and
   * advances the parser.
   * For example:
   *   1 byte  wide: 1xxx xxxx
   *   2 bytes wide: 01xx xxxx xxxx xxxx
   *   3 bytes wide: 001x xxxx xxxx xxxx xxxx xxxx
   * @returns {Uint8Array} The variable sized integer.
   * @private
   */
  parseVint_() {
    const position = this.reader_.getPosition()
    const firstByte = this.reader_.readUint8()
    if (firstByte === 0) {
      throw new ShakaError(
        ShakaError.Severity.CRITICAL,
        ShakaError.Category.MEDIA,
        ShakaError.Code.EBML_OVERFLOW
      )
    }

    // Determine the index of the highest bit set.
    const index = Math.floor(Math.log2(firstByte))
    const numBytes = 8 - index

    if (process.env.NODE_ENV === 'development' && (numBytes > 8 || numBytes < 1)) {
      throw new Error('Assertion failure: Incorrect log2 value')
    }

    this.reader_.skip(numBytes - 1)
    return BufferUtils.toUint8(this.dataView_, position, numBytes)
  }
}

// Lets us use the type in ./WebmSegmentIndexParser.js without actually exporting the class
/** @typedef {EbmlElement} EbmlElement */

class EbmlElement {
  /**
   * @param {number} id The ID.
   * @param {DataView} dataView The DataView.
   */
  constructor(id, dataView) {
    /** @type {number} */
    this.id = id

    /** @private {DataView} */
    this.dataView_ = dataView
  }

  /**
   * Gets the element's offset from the beginning of the buffer.
   * @returns {number}
   */
  getOffset() {
    return this.dataView_.byteOffset
  }

  /**
   * Interpret the element's data as a list of sub-elements.
   * @returns {EbmlParser} A parser over the sub-elements.
   */
  createParser() {
    return new EbmlParser(this.dataView_)
  }

  /**
   * Interpret the element's data as an unsigned integer.
   * @returns {number}
   */
  getUint() {
    if (this.dataView_.byteLength > 8) {
      throw new ShakaError(
        ShakaError.Severity.CRITICAL,
        ShakaError.Category.MEDIA,
        ShakaError.Code.EBML_OVERFLOW
      )
    }

    // Ensure we have at most 53 meaningful bits.
    if ((this.dataView_.byteLength === 8) &&
      (this.dataView_.getUint8(0) & 0xe0)) {
      throw new ShakaError(
        ShakaError.Severity.CRITICAL,
        ShakaError.Category.MEDIA,
        ShakaError.Code.JS_INTEGER_OVERFLOW
      )
    }

    let value = 0

    for (let i = 0; i < this.dataView_.byteLength; i++) {
      const chunk = this.dataView_.getUint8(i)
      value = (256 * value) + chunk
    }

    return value
  }

  /**
   * Interpret the element's data as a floating point number
   * (32 bits or 64 bits). 80-bit floating point numbers are not supported.
   * @returns {number}
   */
  getFloat() {
    if (this.dataView_.byteLength === 4) {
      return this.dataView_.getFloat32(0)
    } else if (this.dataView_.byteLength === 8) {
      return this.dataView_.getFloat64(0)
    } else {
      throw new ShakaError(
        ShakaError.Severity.CRITICAL,
        ShakaError.Category.MEDIA,
        ShakaError.Code.EBML_BAD_FLOATING_POINT_SIZE
      )
    }
  }
}

/**
 * Gets the value of a variable sized integer.
 * For example, the x's below are part of the vint's value.
 *    7-bit value: 1xxx xxxx
 *   14-bit value: 01xx xxxx xxxx xxxx
 *   21-bit value: 001x xxxx xxxx xxxx xxxx xxxx
 * @param {Uint8Array} vint The variable sized integer.
 * @returns {number} The value of the variable sized integer.
 */
function getVintValue(vint) {
  // If |vint| is 8 bytes wide then we must ensure that it does not have more
  // than 53 meaningful bits. For example, assume |vint| is 8 bytes wide,
  // so it has the following structure,
  // 0000 0001 | xxxx xxxx ...
  // Thus, the first 3 bits following the first byte of |vint| must be 0.
  if ((vint.length === 8) && (vint[1] & 0xe0)) {
    throw new ShakaError(
      ShakaError.Severity.CRITICAL,
      ShakaError.Category.MEDIA,
      ShakaError.Code.JS_INTEGER_OVERFLOW
    )
  }

  let value = 0
  for (let i = 0; i < vint.length; i++) {
    const item = vint[i]
    if (i === 0) {
      // Mask out the first few bits of |vint|'s first byte to get the most
      // significant bits of |vint|'s value. If |vint| is 8 bytes wide then
      // |value| will be set to 0.
      const mask = 0x1 << (8 - vint.length)
      value = item & (mask - 1)
    } else {
      // Note that we cannot use << since |value| may exceed 32 bits.
      value = (256 * value) + item
    }
  }

  return value
}

const DYNAMIC_SIZES = [
  [0xff],
  [0x7f, 0xff],
  [0x3f, 0xff, 0xff],
  [0x1f, 0xff, 0xff, 0xff],
  [0x0f, 0xff, 0xff, 0xff, 0xff],
  [0x07, 0xff, 0xff, 0xff, 0xff, 0xff],
  [0x03, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
  [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]
]

/**
 * Checks if the given variable sized integer represents a dynamic size value.
 * @param {Uint8Array} vint The variable sized integer.
 * @returns {boolean} true if |vint| represents a dynamic size value,
 *   false otherwise.
 */
function isDynamicSizeValue(vint) {
  for (const dynamicSizeConst of DYNAMIC_SIZES) {
    if (BufferUtils.equal(vint, new Uint8Array(dynamicSizeConst))) {
      return true
    }
  }

  return false
}
