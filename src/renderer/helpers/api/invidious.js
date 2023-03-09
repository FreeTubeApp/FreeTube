import store from '../../store/index'
import { isNullOrEmpty, stripHTML, toLocalePublicationString } from '../utils'
import autolinker from 'autolinker'

function getCurrentInstance() {
  return store.getters.getCurrentInvidiousInstance
}

export function invidiousAPICall({ resource, id = '', params = {}, doLogError = true, subResource = '' }) {
  return new Promise((resolve, reject) => {
    const requestUrl = getCurrentInstance() + '/api/v1/' + resource + '/' + id + (!isNullOrEmpty(subResource) ? `/${subResource}` : '') + '?' + new URLSearchParams(params).toString()
    fetch(requestUrl)
      .then((response) => response.json())
      .then((json) => {
        if (json.error !== undefined) {
          throw new Error(json.error)
        }
        resolve(json)
      })
      .catch((error) => {
        if (doLogError) {
          console.error('Invidious API error', requestUrl, error)
        }
        reject(error)
      })
  })
}

/**
 * Gets the channel ID for a channel URL
 * used to get the ID for channel usernames and handles
 * @param {string} url
 */
export async function invidiousGetChannelId(url) {
  try {
    const response = await invidiousAPICall({
      resource: 'resolveurl',
      params: {
        url
      },
      doLogError: false
    })

    if (response.pageType === 'WEB_PAGE_TYPE_CHANNEL') {
      return response.ucid
    } else {
      return null
    }
  } catch {
    return null
  }
}

export async function invidiousGetChannelInfo(channelId) {
  return await invidiousAPICall({
    resource: 'channels',
    id: channelId,
  })
}

export async function invidiousGetPlaylistInfo(playlistId) {
  return await invidiousAPICall({
    resource: 'playlists',
    id: playlistId,
  })
}

export async function invidiousGetVideoInformation(videoId) {
  return await invidiousAPICall({
    resource: 'videos',
    id: videoId,
  })
}
export async function invidiousGetComments({ id, nextPageToken = '', sortNewest = true }) {
  const payload = {
    resource: 'comments',
    id: id,
    params: {
      continuation: nextPageToken ?? '',
      sort_by: sortNewest ? 'new' : 'top'
    }
  }
  const response = await invidiousAPICall(payload)

  const commentData = parseInvidiousCommentData(response)

  return { response, commentData }
}

export async function invidiousGetCommentReplies({ id, replyToken }) {
  const payload = {
    resource: 'comments',
    id: id,
    params: {
      continuation: replyToken
    }
  }

  const response = await invidiousAPICall(payload)
  return { commentData: parseInvidiousCommentData(response), continuation: response.continuation ?? null }
}

export function youtubeImageUrlToInvidious(url, currentInstance = null) {
  if (currentInstance === null) {
    currentInstance = getCurrentInstance()
  }
  // Can be prefixed with `https://` or `//` (protocol relative)
  if (url.startsWith('//')) {
    url = 'https:' + url
  }
  const newUrl = `${currentInstance}/ggpht`
  return url.replace('https://yt3.ggpht.com', newUrl)
    .replace('https://yt3.googleusercontent.com', newUrl)
    .replace(/https:\/\/i\d*\.ytimg\.com/, newUrl)
}

export function invidiousImageUrlToInvidious(url, currentInstance = null) {
  return url.replace(/^.+(ggpht.+)/, currentInstance)
}

function parseInvidiousCommentData(response) {
  return response.comments.map((comment) => {
    comment.showReplies = false
    comment.authorLink = comment.authorId
    comment.authorThumb = youtubeImageUrlToInvidious(comment.authorThumbnails[1].url)
    comment.likes = comment.likeCount
    comment.text = autolinker.link(stripHTML(comment.content))
    comment.dataType = 'invidious'
    comment.isOwner = comment.authorIsChannelOwner
    comment.numReplies = comment.replies?.replyCount ?? 0
    comment.replyToken = comment.replies?.continuation ?? ''
    comment.isHearted = comment.creatorHeart !== undefined
    comment.replies = []
    comment.time = toLocalePublicationString({
      publishText: comment.publishedText
    })

    return comment
  })
}

export async function invidiousGetCommunityPosts(channelId) {
  const payload = {
    resource: 'channels',
    id: channelId,
    subResource: 'community'
  }

  const response = await invidiousAPICall(payload)
  response.comments = response.comments.map(communityPost => parseInvidiousCommunityData(communityPost))
  return response.comments
}

function parseInvidiousCommunityData(data) {
  return {
    postText: data.contentHtml,
    postId: data.commentId,
    authorThumbnails: data.authorThumbnails.map(thumbnail => {
      thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
      return thumbnail
    }),
    publishedText: data.publishedText,
    voteCount: data.likeCount,
    postContent: parseInvidiousCommunityAttachments(data.attachment),
    commentCount: data?.replyCount ?? 0, // https://github.com/iv-org/invidious/pull/3635/
    author: data.author,
    type: 'community'
  }
}

function parseInvidiousCommunityAttachments(data) {
  if (!data) {
    return null
  }

  if (data.type === 'image') {
    return {
      type: data.type,
      content: data.imageThumbnails.map(thumbnail => {
        thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
        return thumbnail
      })
    }
  }

  if (data.type === 'video') {
    data.videoThumbnails = data.videoThumbnails.map(thumbnail => {
      thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
      return thumbnail
    })
    return {
      type: data.type,
      content: data
    }
  }

  if (data.type === 'multiImage') {
    const content = data.images.map(imageThumbnails => {
      return imageThumbnails.map(thumbnail => {
        thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
        return thumbnail
      })
    })
    return {
      type: 'multiImage',
      content: content
    }
  }

  // https://github.com/iv-org/invidious/pull/3635/files
  if (data.type === 'poll') {
    return {
      type: 'poll',
      totalVotes: data.totalVotes ?? 0,
      content: data.choices.map(choice => {
        return {
          text: choice.text,
          image: choice.image.map(thumbnail => {
            thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
            return thumbnail
          })
        }
      })
    }
  }

  console.error('New Invidious Community Post Type: ' + data.type)
}

/**
 * video.js only supports MP4 DASH not WebM DASH
 * so we filter out the WebM DASH formats
 * @param {any[]} formats
 * @param {boolean} allowAv1 Use the AV1 formats if they are available
 */
export function filterInvidiousFormats(formats, allowAv1 = false) {
  const audioFormats = []
  const h264Formats = []
  const av1Formats = []

  formats.forEach(format => {
    const mimeType = format.type

    if (mimeType.startsWith('audio/mp4')) {
      audioFormats.push(format)
    } else if (allowAv1 && mimeType.startsWith('video/mp4; codecs="av01')) {
      av1Formats.push(format)
    } else if (mimeType.startsWith('video/mp4; codecs="avc')) {
      h264Formats.push(format)
    }
  })

  if (allowAv1 && av1Formats.length > 0) {
    return [...audioFormats, ...av1Formats]
  } else {
    return [...audioFormats, ...h264Formats]
  }
}
