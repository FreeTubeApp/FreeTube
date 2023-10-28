import { DBHighlightedCommentHandlers } from '../../../datastores/handlers/index'

const state = {
  videoHighlightedComments: {},
  videoHighlightedReplyComments: {},
  videoHighlightedReplies: {}
}

const getters = {
  getHighlightedComments: (state) => (videoId) => (
    videoId in state.videoHighlightedComments
      ? state.videoHighlightedComments[videoId]
      : []
  ),
  getHighlightedReplies: (state) => (videoId, commentId) => (
    (videoId in state.videoHighlightedReplies &&
     commentId in state.videoHighlightedReplies[videoId])
      ? state.videoHighlightedReplies[videoId][commentId]
      : []
  ),
  getHighlightedReplyComments: (state) => (videoId) => (
    videoId in state.videoHighlightedReplyComments
      ? state.videoHighlightedReplyComments[videoId]
      : []
  ),
}

const actions = {
  async addVideoId({ commit }, payload) {
    try {
      await DBHighlightedCommentHandlers.create(payload)
      commit('addVideoId', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
  async highlightComment({ commit }, payload) {
    try {
      await DBHighlightedCommentHandlers.upsertHighlightedComment(payload.videoId, payload.comment)
      commit('upsertHighlightedComment', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
  async unhighlightComment({ commit }, payload) {
    try {
      await DBHighlightedCommentHandlers.deleteHighlightedComment(payload.videoId, payload.comment)
      commit('deleteHighlightedComment', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
  async highlightReply({ commit }, payload) {
    try {
      await DBHighlightedCommentHandlers.upsertHighlightedReply(payload.videoId, payload.comment, payload.reply)
      commit('upsertHighlightedReply', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
  async unhighlightReply({ commit }, payload) {
    try {
      await DBHighlightedCommentHandlers.deleteHighlightedReply(payload.videoId, payload.comment, payload.reply)
      commit('deleteHighlightedReply', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
  async grabAllHighlightedComments({ commit, dispatch, state }) {
    try {
      const payload = await DBHighlightedCommentHandlers.find()
      commit('setAllHighlightedComments', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  }
}

const mutations = {
  addVideoId(state, videoId) {
    if (!(videoId in state.videoHighlightedComments)) {
      state.videoHighlightedComments[videoId] = []
    }
  },
  upsertHighlightedComment(state, { videoId, comment }) {
    if (videoId in state.videoHighlightedComments) {
      const comments = state.videoHighlightedComments[videoId]
      const existingCommentIndex = comments.findIndex(c => c.commentId === comment.commentId)
      if (existingCommentIndex === -1) {
        state.videoHighlightedComments[videoId].push(comment)
      }
    } else {
      state.videoHighlightedComments[videoId] = [comment]
    }
  },
  deleteHighlightedComment(state, { videoId, comment }) {
    if (videoId in state.videoHighlightedComments) {
      state.videoHighlightedComments[videoId] = state.videoHighlightedComments[videoId].filter(entry => entry.commentId !== comment.commentId)
    }
  },
  upsertHighlightedReply(state, { comment, videoId, reply }) {
    if (videoId in state.videoHighlightedReplyComments) {
      const comments = state.videoHighlightedReplyComments[videoId]
      if (!comments.find(c => c.commentId === comment.commentId)) {
        state.videoHighlightedReplyComments[videoId].push(comment)
      }
    } else {
      state.videoHighlightedReplyComments[videoId] = [comment]
    }
    if (videoId in state.videoHighlightedReplies) {
      if (comment.commentId in state.videoHighlightedReplies[videoId]) {
        if (!state.videoHighlightedReplies[videoId][comment.commentId].find(entry => entry.commentId === reply.commentId)) {
          state.videoHighlightedReplies[videoId][comment.commentId].push(reply)
        } else {
          state.videoHighlightedReplies[videoId][comment.commentId] = [reply]
        }
      } else {
        state.videoHighlightedReplies[videoId][comment.commentId] = [reply]
      }
    } else {
      state.videoHighlightedReplies[videoId] = {}
      state.videoHighlightedReplies[videoId][comment.commentId] = [reply]
    }
  },
  deleteHighlightedReply(state, { videoId, comment, reply }) {
    if (videoId in state.videoHighlightedReplies &&
        comment.commentId in state.videoHighlightedReplies[videoId]) {
      state.videoHighlightedReplies[videoId][comment.commentId] = state.videoHighlightedReplies[videoId][comment.commentId].filter(
        entry => entry.commentId !== reply.commentId
      )
      if (!state.videoHighlightedReplies[videoId][comment.commentId].length) {
        if (videoId in state.videoHighlightedReplyComments) {
          state.videoHighlightedReplyComments[videoId] = state.videoHighlightedReplyComments[videoId].filter(entry => entry.commentId !== comment.commentId)
        }
      }
    }
  },
  setAllHighlightedComments(state, payload) {
    if (Array.isArray(payload) && payload.length > 0) {
      payload.forEach(entry => {
        if (!(entry._id in state.videoHighlightedComments)) {
          state.videoHighlightedComments[entry._id] = []
        }
        state.videoHighlightedComments[entry._id] = (
          state.videoHighlightedComments[entry._id].concat(
            entry.comments
              .filter(x => x.isCommentHighlighted)
              .map(x => JSON.parse(x.comment))))

        if (!(entry._id in state.videoHighlightedReplyComments)) {
          state.videoHighlightedReplyComments[entry._id] = []
        }
        state.videoHighlightedReplyComments[entry._id] = (
          state.videoHighlightedReplyComments[entry._id].concat(
            entry.comments
              .filter(x => x.replies.length > 0)
              .map(x => JSON.parse(x.comment))
          )
        )
        if (!(entry._id in state.videoHighlightedReplies)) {
          state.videoHighlightedReplies[entry._id] = {}
        }
        entry.comments.forEach(commentEntry => {
          if (commentEntry.replies.length > 0) {
            state.videoHighlightedReplies[entry._id][JSON.parse(commentEntry.comment).commentId] = (
              commentEntry.replies.map(x => JSON.parse(x))
            )
          }
        })
      })
    }
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
