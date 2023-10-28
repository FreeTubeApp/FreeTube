import db from '../index'

class Settings {
  static find() {
    return db.settings.findAsync({ _id: { $ne: 'bounds' } })
  }

  static upsert(_id, value) {
    return db.settings.updateAsync({ _id }, { _id, value }, { upsert: true })
  }

  static persist() {
    return db.settings.compactDatafileAsync()
  }

  // ******************** //
  // Unique Electron main process handlers
  static _findAppReadyRelatedSettings() {
    return db.settings.findAsync({
      $or: [
        { _id: 'disableSmoothScrolling' },
        { _id: 'useProxy' },
        { _id: 'proxyProtocol' },
        { _id: 'proxyHostname' },
        { _id: 'proxyPort' }
      ]
    })
  }

  static _findBounds() {
    return db.settings.findOneAsync({ _id: 'bounds' })
  }

  static _findTheme() {
    return db.settings.findOneAsync({ _id: 'baseTheme' })
  }

  static _findSidenavSettings() {
    return {
      hideTrendingVideos: db.settings.findOneAsync({ _id: 'hideTrendingVideos' }),
      hidePopularVideos: db.settings.findOneAsync({ _id: 'hidePopularVideos' }),
      backendFallback: db.settings.findOneAsync({ _id: 'backendFallback' }),
      backendPreference: db.settings.findOneAsync({ _id: 'backendPreference' }),
      hidePlaylists: db.settings.findOneAsync({ _id: 'hidePlaylists' }),
    }
  }

  static _updateBounds(value) {
    return db.settings.updateAsync({ _id: 'bounds' }, { _id: 'bounds', value }, { upsert: true })
  }
  // ******************** //
}

class History {
  static find() {
    return db.history.findAsync({}).sort({ timeWatched: -1 })
  }

  static upsert(record) {
    return db.history.updateAsync({ videoId: record.videoId }, record, { upsert: true })
  }

  static updateWatchProgress(videoId, watchProgress) {
    return db.history.updateAsync({ videoId }, { $set: { watchProgress } }, { upsert: true })
  }

  static updateLastViewedPlaylist(videoId, lastViewedPlaylistId) {
    return db.history.updateAsync({ videoId }, { $set: { lastViewedPlaylistId } }, { upsert: true })
  }

  static delete(videoId) {
    return db.history.removeAsync({ videoId })
  }

  static deleteAll() {
    return db.history.removeAsync({}, { multi: true })
  }

  static persist() {
    return db.history.compactDatafileAsync()
  }
}

class Profiles {
  static create(profile) {
    return db.profiles.insertAsync(profile)
  }

  static find() {
    return db.profiles.findAsync({})
  }

  static upsert(profile) {
    return db.profiles.updateAsync({ _id: profile._id }, profile, { upsert: true })
  }

  static delete(id) {
    return db.profiles.removeAsync({ _id: id })
  }

  static persist() {
    return db.profiles.compactDatafileAsync()
  }
}

class Playlists {
  static create(playlists) {
    return db.playlists.insertAsync(playlists)
  }

  static find() {
    return db.playlists.findAsync({})
  }

  static upsertVideoByPlaylistName(playlistName, videoData) {
    return db.playlists.updateAsync(
      { playlistName },
      { $push: { videos: videoData } },
      { upsert: true }
    )
  }

  static upsertVideoIdsByPlaylistId(_id, videoIds) {
    return db.playlists.updateAsync(
      { _id },
      { $push: { videos: { $each: videoIds } } },
      { upsert: true }
    )
  }

  static delete(_id) {
    return db.playlists.removeAsync({ _id, protected: { $ne: true } })
  }

  static deleteVideoIdByPlaylistName(playlistName, videoId) {
    return db.playlists.updateAsync(
      { playlistName },
      { $pull: { videos: { videoId } } },
      { upsert: true }
    )
  }

  static deleteVideoIdsByPlaylistName(playlistName, videoIds) {
    return db.playlists.updateAsync(
      { playlistName },
      { $pull: { videos: { $in: videoIds } } },
      { upsert: true }
    )
  }

  static deleteAllVideosByPlaylistName(playlistName) {
    return db.playlists.updateAsync(
      { playlistName },
      { $set: { videos: [] } },
      { upsert: true }
    )
  }

  static deleteMultiple(ids) {
    return db.playlists.removeAsync({ _id: { $in: ids }, protected: { $ne: true } })
  }

  static deleteAll() {
    return db.playlists.removeAsync({ protected: { $ne: true } })
  }

  static persist() {
    return db.playlists.compactDatafileAsync()
  }
}

class HighlightedComments {
  static create(videoId) {
    return db.highlightedComments.insertAsync(videoId)
  }

  static find() {
    return db.highlightedComments.findAsync({})
  }

  static async upsertHighlightedComment(videoId, comment) {
    const highlightedComment = await db.highlightedComments.findOneAsync(
      { _id: videoId })
    let commentIndex = -1
    if (highlightedComment !== null) {
      commentIndex = highlightedComment.comments.findIndex(c => {
        return JSON.parse(c.comment).commentId === JSON.parse(comment).commentId
      })
    }
    if (commentIndex !== -1) {
      // Update the 'isCommentHighlighted' field of the found comment
      return db.highlightedComments.updateAsync(
        { _id: videoId },
        { $set: { [`comments.${commentIndex}.isCommentHighlighted`]: true } },
        {}
      )
    } else {
      // Append the comment to the 'comments' array.
      return db.highlightedComments.updateAsync(
        { _id: videoId },
        { $push: { comments: { comment: comment, replies: [], isCommentHighlighted: true } } },
        { upsert: true }
      )
    }
  }

  static async deleteHighlightedComment(videoId, comment) {
    const highlightedComment = await db.highlightedComments.findOneAsync(
      { _id: videoId })
    let commentIndex = -1
    if (highlightedComment !== null) {
      commentIndex = highlightedComment.comments.findIndex(c => {
        return JSON.parse(c.comment).commentId === JSON.parse(comment).commentId
      })
    }
    if (commentIndex !== -1) {
      const hasReplies = highlightedComment.comments[commentIndex].replies.length > 0
      if (hasReplies) {
        // Update 'isCommentHighlighted' to false if replies are non-empty
        return db.highlightedComments.updateAsync(
          { _id: videoId },
          { $set: { [`comments.${commentIndex}.isCommentHighlighted`]: false } },
          {}
        )
      } else {
        // Remove the entire entry from the 'comments' array if replies are empty
        highlightedComment.comments.splice(commentIndex, 1)
        db.highlightedComments.updateAsync(
          { _id: videoId },
          highlightedComment,
          {}
        )
      }
    }
  }

  static async upsertHighlightedReply(videoId, comment, reply) {
    const highlightedComment = await db.highlightedComments.findOneAsync({ _id: videoId })
    let commentIndex = -1
    if (highlightedComment !== null) {
      commentIndex = highlightedComment.comments.findIndex(c => {
        return JSON.parse(c.comment).commentId === JSON.parse(comment).commentId
      })
    }
    if (commentIndex === -1) {
      // Append a new entry to the comments array
      return db.highlightedComments.updateAsync(
        { _id: videoId },
        { $push: { comments: { comment: comment, replies: [reply], isCommentHighlighted: false } } },
        { upsert: true }
      )
    } else {
      // Append the reply to found comment's replies entry
      return db.highlightedComments.updateAsync(
        { _id: videoId },
        { $push: { [`comments.${commentIndex}.replies`]: reply } },
        { upsert: true }
      )
    }
  }

  static async deleteHighlightedReply(videoId, comment, reply) {
    const highlightedComment = await db.highlightedComments.findOneAsync({ _id: videoId })
    let commentIndex = -1
    if (highlightedComment !== null) {
      commentIndex = highlightedComment.comments.findIndex(c => {
        return JSON.parse(c.comment).commentId === JSON.parse(comment).commentId
      })
    }
    if (commentIndex !== -1) {
      const moreReplies = highlightedComment.comments[commentIndex].replies.length > 1
      const isCommentHighlighted = highlightedComment.comments[commentIndex].isCommentHighlighted
      if (!moreReplies && !isCommentHighlighted) {
        // Remove the entire entry from the 'comments' array if there are no more
        // highlighted replies and the comment is not highlighted
        highlightedComment.comments.splice(commentIndex, 1)
      } else {
        // Remove the reply entry from the 'replies' array for the found comment.
        highlightedComment.comments[commentIndex].replies = (
          highlightedComment.comments[commentIndex].replies.filter(
            r => JSON.parse(r).commentId !== JSON.parse(reply).commentId
          )
        )
      }
      db.highlightedComments.updateAsync(
        { _id: videoId },
        highlightedComment,
        {}
      )
    }
  }

  static persist() {
    return db.highlightedComments.compactDatafileAsync()
  }
}

function compactAllDatastores() {
  return Promise.allSettled([
    Settings.persist(),
    History.persist(),
    Profiles.persist(),
    Playlists.persist(),
    HighlightedComments.persist()
  ])
}

const baseHandlers = {
  settings: Settings,
  history: History,
  profiles: Profiles,
  playlists: Playlists,
  highlightedComments: HighlightedComments,

  compactAllDatastores
}

export default baseHandlers
