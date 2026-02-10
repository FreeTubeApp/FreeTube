/**
 * @typedef {object} VideoData
 * @prop {string | null} videoId
 * @prop {string | null} playlistItemId
 */

/**
 * @typedef {object} EventHandlers
 * @prop {(event: DragEvent, video: VideoData) => void} dragVideo
 * @prop {(video: VideoData, draggedVideo: VideoData) => void} moveDraggedVideo
 * @prop {() => void} afterDrag
 */

/**
 *
 * @param {(event: string, args: any[]) => void} emit
 * @returns {EventHandlers} eventHandlers
 */
export const handleDragAndDrop = (emit) => {
  /**
   * @type {EventHandlers.dragVideo}
   */
  const dragVideo = (event, { videoId, playlistItemId }) => {
    // Prevent grabbing cursor from being overridden by the copy cursor.
    event.dataTransfer.effectAllowed = 'move'

    emit('drag-video', { videoId, playlistItemId })
  }

  /**
   * @type {EventHandlers.moveDraggedVideo}
   */
  const moveDraggedVideo = (video, draggedVideo) => {
    const differentVideo = video.videoId !== draggedVideo.videoId

    if (differentVideo) {
      emit('move-dragged-video', video, draggedVideo)
    }
  }

  /**
   * @type {EventHandlers.afterDrag}
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
