import { isNullOrEmpty, toLocalePublicationString } from '../utils'
const apiUrl = 'https://pipedapi.kavin.rocks'

export async function pipedRequest({ resource, id = '', params = {}, doLogError = true, subResource = '' }) {
  const requestUrl = apiUrl + '/' + resource + '/' + id + (!isNullOrEmpty(subResource) ? `/${subResource}` : '') + '?' + new URLSearchParams(params).toString()
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
      return error
    })
}

export async function getPipedComments(videoId) {
  const commentInfo = await pipedRequest({ resource: 'comments', id: videoId })
  commentInfo.comments = parsePipedComments(commentInfo.comments)
  return {
    comments: commentInfo.comments,
    continuation: commentInfo.nextpage
  }
}

export async function getPipedCommentsMore({ videoId, continuation }) {
  const commentInfo = await pipedRequest({
    resource: 'nextpage/comments',
    id: videoId,
    params: {
      nextpage: continuation
    }
  })
  commentInfo.comments = parsePipedComments(commentInfo.comments)
  return {
    comments: commentInfo.comments,
    continuation: commentInfo.nextpage
  }
}
function parsePipedComments(comments) {
  return comments.map(comment => {
    return {
      dataType: 'piped',
      author: comment.author,
      authorLink: comment.commentorUrl.replace('/channel/'),
      authorThumb: comment.thumbnail,
      comemntId: comment.commentId,
      text: comment.commentText,
      isPinned: comment.pinned,
      isVerified: comment.verified,
      numReplies: comment.replyCount,
      likes: comment.likeCount,
      isHearted: comment.isHearted,
      replyToken: comment.repliesPage,
      isMember: false,
      isOwner: false,
      showReplies: false,
      replies: [],
      time: toLocalePublicationString({
        publishText: comment.commentedTime
      })
    }
  })
}
