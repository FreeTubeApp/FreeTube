/**
 * @typedef {object} VideoData
 * @prop {string | null} videoId
 * @prop {string | null} playlistItemId
 */

/**
 * @callback DragVideo
 * @param {DragEvent} event
 * @param {VideoData} video
 */

/**
 * @callback MoveDraggedVideo
 * @param {VideoData} video
 * @param {VideoData} draggedVideo
 */

/**
 * @callback AfterDrag
 */

/**
 * @typedef {object} EventHandlers
 * @prop {DragVideo} dragVideo
 * @prop {MoveDraggedVideo} moveDraggedVideo
 * @prop {AfterDrag} afterDrag
 */

/**
 *
 * @param {(event: string, args: any[]) => void} emit
 * @returns {EventHandlers} eventHandlers
 */
export const handleDragAndDrop = (emit) => {
  /**
   * @type {DragVideo}
   */
  const dragVideo = (event, { videoId, playlistItemId }) => {
    // Use correct drag cursor.
    event.dataTransfer.effectAllowed = 'move'

    // Allows drag and drop to work with touch devices.
    event.dataTransfer.setData('text/plain', '_')

    emit('drag-video', { videoId, playlistItemId })
  }

  /**
   * @type {MoveDraggedVideo}
   */
  const moveDraggedVideo = (video, draggedVideo) => {
    const differentVideo = video.videoId !== draggedVideo.videoId

    if (differentVideo) {
      emit('move-dragged-video', video, draggedVideo)
    }
  }

  /**
   * @type {AfterDrag}
   */
  const afterDrag = () => {
    emit('drag-video-end')
  }

  return {
    dragVideo,
    moveDraggedVideo,
    afterDrag,
  }
}
