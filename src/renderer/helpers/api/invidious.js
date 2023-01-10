import store from '../../store/index'
import { stripHTML, toLocalePublicationString } from '../utils'
import autolinker from 'autolinker'

function getCurrentInstance() {
  return store.getters.getCurrentInvidiousInstance
}

export function invidiousAPICall({ resource, id = '', params = {} }) {
  return new Promise((resolve, reject) => {
    const requestUrl = getCurrentInstance() + '/api/v1/' + resource + '/' + id + '?' + new URLSearchParams(params).toString()

    fetch(requestUrl)
      .then((response) => response.json())
      .then((json) => {
        if (json.error !== undefined) {
          throw new Error(json.error)
        }
        resolve(json)
      })
      .catch((error) => {
        console.error('Invidious API error', requestUrl, error)
        reject(error)
      })
  })
}

export async function invidiousGetChannelInfo(channelId) {
  return new Promise((resolve, reject) => {
    invidiousAPICall({
      resource: 'channels',
      id: channelId,
    }).then(response => {
      resolve(response)
    }).catch(xhr => {
      console.error(xhr)
      reject(xhr)
    })
  })
}

export async function invidiousGetPlaylistInfo(playlistId) {
  const payload = {
    resource: 'playlists',
    id: playlistId
  }
  return new Promise((resolve, reject) => {
    invidiousAPICall(payload).then((response) => {
      resolve(response)
    }).catch((xhr) => {
      console.error(xhr)
      reject(xhr)
    })
  })
}

export async function invidiousGetVideoInformation(videoId) {
  return new Promise((resolve, reject) => {
    invidiousAPICall({ resource: 'videos', id: videoId }).then((response) => {
      resolve(response)
    }).catch((xhr) => {
      console.error(xhr)
      reject(xhr)
    })
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

function parseInvidiousCommentData(response) {
  return response.comments.map((comment) => {
    comment.showReplies = false
    comment.authorLink = comment.authorId
    comment.authorThumb = comment.authorThumbnails[1].url.replace('https://yt3.ggpht.com', `${getCurrentInstance()}/ggpht/`)
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
