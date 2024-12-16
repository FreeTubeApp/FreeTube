import store from '../../store/index'
import { calculatePublishedDate, getRelativeTimeFromDate } from '../utils'
import { isNullOrEmpty } from '../strings'

/**
 * @returns {string}
 */
function getCurrentInstance() {
  return store.getters.getCurrentPipedInstance
}

/**
 * @returns {Promise<any> | Promise<{isError : boolean, error: string}>}
 */
export async function pipedRequest({ resource, id = '', params = {}, doLogError = true, subResource = '' }) {
  const requestUrl = getCurrentInstance() + '/' + resource + '/' + id + (!isNullOrEmpty(subResource) ? `/${subResource}` : '') + '?' + new URLSearchParams(params).toString()
  return await fetch(requestUrl)
    .then((response) => response.json())
    .then((json) => {
      if (json.error !== undefined) {
        throw new Error(json.error)
      }
      return json
    })
    .catch((error) => {
      if (doLogError) {
        console.error('Piped API error', requestUrl, error)
      }
      return { isError: true, error }
    })
}

/**
 * @typedef {{url: string, type: string, title: string, thumbnail: string, uploaderName: string, uploaderUrl: string, uploaderAvatar: string, uploadedDate: string, shortDescription: string, duration: number, views: number, uploaded: number, uploaderVerified: boolean, isShort: boolean}} PipedVideoType
 * @typedef {{author: string, thumbnail: string, commentId: string, commentText: string, commentedTime: string, commentorUrl : string, repliesPage: string, likeCount: number, replyCount: number, hearted: boolean, pinned: boolean, verified: boolean, creatorReplied: boolean, channelOwner: boolean}} PipedCommentsType
 * @typedef {{name: string, thumbnailUrl: string, description: string, bannerUrl: string, nextpage: string, uploader: string, uploaderUrl: string, uploaderAvatar: string, videos: number, relatedStreams: PipedVideoType[]}} PipedPlaylistType
 * @typedef {{isError: true, error: string}} PipedError
 */

/**
 * @param {string} videoId
 */
export async function getPipedComments(videoId) {
  /** @type { PipedError | {nextpage: string?, commentCount: number?, disabled: boolean?, comments: PipedCommentsType[]?} } */
  const commentInfo = await pipedRequest({ resource: 'comments', id: videoId })
  if (commentInfo.isError) {
    throw commentInfo.error
  } else {
    commentInfo.comments = parsePipedComments(commentInfo.comments)
    return {
      comments: commentInfo.comments,
      continuation: commentInfo.nextpage
    }
  }
}

/**
 * @param {object} params - The parameters for fetching comments.
 * @param {string} params.videoId - The ID of the video for which to fetch comments.
 * @param {string} params.continuation - The continuation token for paginated comments.
 */
export async function getPipedCommentsMore({ videoId, continuation }) {
  /** @type {PipedError | {nextpage: string, commentCount: number, disabled: boolean, comments: PipedCommentsType[] }} */
  const commentInfo = await pipedRequest({
    resource: 'nextpage/comments',
    id: videoId,
    params: {
      nextpage: continuation
    }
  })

  if (commentInfo.isError) {
    throw commentInfo.error
  } else {
    commentInfo.comments = parsePipedComments(commentInfo.comments)
    return {
      comments: commentInfo.comments,
      continuation: commentInfo.nextpage
    }
  }
}
/**
 * @param {PipedCommentsType[]} comments
 */
function parsePipedComments(comments) {
  return comments.map(comment => {
    const authorId = comment.commentorUrl.replace('/channel/', '')
    return {
      dataType: 'piped',
      author: comment.author,
      authorId: authorId,
      authorLink: authorId,
      authorThumb: comment.thumbnail,
      commentId: comment.commentId,
      id: comment.commentId,
      text: comment.commentText,
      isPinned: comment.pinned,
      isVerified: comment.verified,
      numReplies: comment.replyCount,
      likes: comment.likeCount,
      isHearted: comment.hearted,
      replyToken: comment.repliesPage,
      hasReplyToken: !!comment.repliesPage,
      isMember: false,
      isOwner: comment.channelOwner,
      showReplies: false,
      replies: [],
      hasOwnerReplied: comment.creatorReplied,
      time: getRelativeTimeFromDate(calculatePublishedDate(comment.commentedTime), false),
    }
  })
}

/**
 * @param {string} playlistId
 */
export async function getPipedPlaylist(playlistId) {
  /** @type {{PipedError | PipedPlaylistType}} */
  const playlistInfo = await pipedRequest({ resource: 'playlists', id: playlistId })
  if (playlistInfo.isError) {
    throw playlistInfo.error
  } else {
    const parsedVideos = parsePipedVideos(playlistInfo.relatedStreams)
    return {
      nextpage: playlistInfo.nextpage,
      playlist: parsePipedPlaylist(playlistId, playlistInfo, parsedVideos),
      videos: parsedVideos
    }
  }
}

/**
 * @param {object} params - The parameters for fetching comments.
 * @param {string} params.playlistId - The ID of the video for which to fetch comments.
 * @param {string} params.continuation - The continuation token for paginated comments.
 */
export async function getPipedPlaylistMore({ playlistId, continuation }) {
  /** @type {PipedError | {nextpage: string, relatedStreams: PipedVideoType[]}} */
  const playlistInfo = await pipedRequest({
    resource: 'nextpage/playlists',
    id: playlistId,
    params: {
      nextpage: continuation
    }
  })

  if (playlistInfo.isError) {
    throw playlistInfo.error
  } else {
    return {
      nextpage: playlistInfo.nextpage,
      videos: parsePipedVideos(playlistInfo.relatedStreams)
    }
  }
}

/**
 * @param {string} query
 * @returns {[string, string[]]}
 */
export async function getPipedSearchSuggestions(query) {
  const searchInfo = await pipedRequest({
    resource: 'opensearch/suggestions',
    params: {
      query
    }
  })

  return searchInfo[1]
}

/**
 * @param {string} url
 * @returns {{host: string, imageProtocol : string, resource: string, baseUrl: string}?}
 */
export function getPipedUrlInfo(url) {
  const regex = /^(?<baseUrl>(https?:\/\/)[^/]*)\/((?<imageProtocol>vi|ytc)\/)?(?<resource>[^?]*).*host=(?<host>[^&]*)/
  return url.match(regex)?.groups
}

/**
 * @param {string} url
 * @returns {string}
 */
export function pipedImageToYouTube(url) {
  const urlInfo = getPipedUrlInfo(url)
  let newUrl = `https://${urlInfo.host}/`
  if (!isNullOrEmpty(urlInfo.imageProtocol)) {
    newUrl += `${urlInfo.imageProtocol}/`
  }
  newUrl += urlInfo.resource
  return newUrl
}

/**
 * @param {string} playlistId
 * @param {PipedPlaylistType} result
 * @param {ReturnType<typeof parsePipedVideos>} parsedVideos
 */
function parsePipedPlaylist(playlistId, result, parsedVideos) {
  return {
    id: playlistId,
    title: result.name,
    description: result.description,
    firstVideoId: parsedVideos[0].videoId,
    viewCount: null,
    videoCount: result.videos,
    channelName: result.uploader,
    channelThumbnail: result.uploaderAvatar,
    channelId: result.uploaderUrl.replace('/channel/', ''),
    firstVideoThumbnail: parsedVideos[0].thumbnail,
    thumbnailUrl: result.thumbnailUrl,
    infoSource: 'piped'
  }
}

/**
 * @param {PipedVideoType[]} videoList
 */
function parsePipedVideos(videoList) {
  return videoList.map(video => {
    return {
      videoId: video.url.replace('/watch?v=', ''),
      title: video.title,
      author: video.uploaderName,
      authorId: video.uploaderUrl.replace('/channel/', ''),
      lengthSeconds: video.duration,
      description: video.shortDescription,
      publishedText: video.uploadedDate, // uploaded time stamp
      viewCount: video.views,
      thumbnail: video.thumbnail,
      isVerified: video.uploaderVerified,
      type: 'video'
    }
  })
}

/**
 * @param {string} region
 */
export async function getPipedTrending(region) {
  /** @type {{isError: boolean, error: string} | {PipedVideoType}[]} */
  const trendingInfo = await pipedRequest({ resource: 'trending', params: { region } })
  if (trendingInfo.isError) {
    throw trendingInfo.error
  } else {
    return parsePipedVideos(trendingInfo)
  }
}
