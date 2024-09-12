import { defineComponent } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtTimestampCatcher from '../../components/ft-timestamp-catcher/ft-timestamp-catcher.vue'
import { copyToClipboard, showToast } from '../../helpers/utils'
import { getInvidiousCommunityPostCommentReplies, getInvidiousCommunityPostComments, invidiousGetCommentReplies, invidiousGetComments } from '../../helpers/api/invidious'
import { getLocalComments, parseLocalComment } from '../../helpers/api/local'
import { getPipedComments, getPipedCommentsMore } from '../../helpers/api/piped'
export default defineComponent({
  name: 'WatchVideoComments',
  components: {
    'ft-card': FtCard,
    'ft-loader': FtLoader,
    'ft-select': FtSelect,
    'ft-timestamp-catcher': FtTimestampCatcher
  },
  props: {
    id: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      required: true
    },
    videoPlayerReady: {
      type: Boolean,
      required: true
    },
    forceState: {
      type: String,
      default: null,
    },
    isPostComments: {
      type: Boolean,
      default: false,
    },
    postAuthorId: {
      type: String,
      default: null
    },
    showSortBy: {
      type: Boolean,
      default: true,
    }
  },
  emits: ['timestamp-event'],
  setup: function () {
    // As we don't need or even want reactivity here,
    // we can use a Map.
    const replyTokens = new Map()

    return {
      replyTokens
    }
  },
  data: function () {
    return {
      isLoading: false,
      showComments: false,
      nextPageToken: null,
      commentData: [],
      sortNewest: false,
      apiUsed: 'local',
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    fallbackPreference: function () {
      return this.$store.getters.getFallbackPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    hideCommentLikes: function () {
      return this.$store.getters.getHideCommentLikes
    },

    hideCommentPhotos: function () {
      return this.$store.getters.getHideCommentPhotos
    },

    sortNames: function () {
      return [
        this.$t('Comments.Top comments'),
        this.$t('Comments.Newest first')
      ]
    },

    sortValues: function () {
      return [
        'top',
        'newest'
      ]
    },

    currentSortValue: function () {
      return (this.sortNewest) ? 'newest' : 'top'
    },

    generalAutoLoadMorePaginatedItemsEnabled() {
      return this.$store.getters.getGeneralAutoLoadMorePaginatedItemsEnabled
    },
    observeVisibilityOptions: function () {
      if (!this.generalAutoLoadMorePaginatedItemsEnabled) {
        return false
      }
      if (!this.videoPlayerReady && !this.isPostComments) { return false }

      return {
        callback: (isVisible, _entry) => {
          // This is also fired when **hidden**
          // No point doing anything if not visible
          if (!isVisible) { return }
          // It's possible the comments are being loaded/already loaded
          if (this.canPerformInitialCommentLoading) {
            this.getCommentData()
          } else if (this.canPerformMoreCommentLoading) {
            this.getMoreComments()
          }
        },
        intersection: {
          // Only when it intersects with N% above bottom
          rootMargin: '0% 0% 0% 0%',
        },
        // Callback responsible for loading multiple comment pages
        once: false,
      }
    },

    canPerformInitialCommentLoading: function () {
      return this.commentData.length === 0 && !this.isLoading && !this.showComments
    },

    canPerformMoreCommentLoading: function () {
      return this.commentData.length > 0 && !this.isLoading && this.showComments && this.nextPageToken
    },

    subscriptions: function() {
      return this.$store.getters.getActiveProfile.subscriptions
    }
  },
  created: function () {
    // region No comment detection
    // For videos without any comment (comment disabled?)
    // e.g. https://youtu.be/8NBSwDEf8a8
    //
    // `comments_entry_point_header` is null probably when comment disabled
    if (this.forceState === 'noComment') {
      this.commentData = []
      this.nextPageToken = null
      this.isLoading = false
      this.showComments = true
    }
    // endregion No comment detection
  },
  methods: {
    onTimestamp: function (timestamp) {
      this.$emit('timestamp-event', timestamp)
    },

    handleSortChange: function () {
      this.sortNewest = !this.sortNewest
      this.commentData = []
      // nextPageToken is reset to ensure first page is get
      this.nextPageToken = null
      this.getCommentData()
    },

    getCommentData: function () {
      this.isLoading = true
      if (this.backendPreference === 'piped' && !this.isPostComments) {
        this.getCommentDataPiped()
      } else if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious' || this.isPostComments) {
        if (!this.isPostComments) {
          this.getCommentDataInvidious()
        } else {
          this.getPostCommentsInvidious()
        }
      } else {
        this.getCommentDataLocal()
      }
    },

    getMoreComments: function () {
      if (this.commentData.length === 0 || this.nextPageToken === null || typeof this.nextPageToken === 'undefined') {
        showToast(this.$t('Comments.There are no more comments for this video'))
      } else {
        if (this.apiUsed === 'piped' && !this.isPostComments) {
          this.getCommentDataPipedMore(this.nextPageToken)
        } else if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious' || this.isPostComments) {
          if (!this.isPostComments) {
            this.getCommentDataInvidious()
          } else {
            this.getPostCommentsInvidious()
          }
        } else {
          this.getCommentDataLocal(true)
        }
      }
    },

    toggleCommentReplies: function (index) {
      if (this.commentData[index].showReplies || this.commentData[index].replies.length > 0) {
        this.commentData[index].showReplies = !this.commentData[index].showReplies
      } else {
        this.getCommentReplies(index)
      }
    },

    getCommentReplies: function (index) {
      if (this.commentData[index].dataType === 'piped' && !this.isPostComments) {
        this.getCommentDataPipedMore(this.replyTokens.get(this.commentData[index].id), index)
      } else if (!process.env.SUPPORTS_LOCAL_API || this.commentData[index].dataType === 'invidious' || this.isPostComments) {
        if (!this.isPostComments) {
          this.getCommentRepliesInvidious(index)
        } else {
          this.getPostCommentRepliesInvidious(index)
        }
      } else {
        this.getCommentRepliesLocal(index)
      }
    },

    getCommentDataLocal: async function (more) {
      try {
        /** @type {import('youtubei.js').YT.Comments} */
        let comments
        if (more) {
          comments = await this.nextPageToken.getContinuation()
        } else {
          comments = await getLocalComments(this.id, this.sortNewest)
        }

        const parsedComments = comments.contents
          .map(commentThread => {
            // Use destructuring to create a new object without the replyToken
            const { replyToken, ...comment } = parseLocalComment(commentThread.comment, commentThread)

            if (comment.hasReplyToken) {
              this.replyTokens.set(comment.id, replyToken)
            } else {
              this.replyTokens.delete(comment.id)
            }

            return comment
          })

        if (more) {
          this.commentData = this.commentData.concat(parsedComments)
        } else {
          this.commentData = parsedComments
        }

        this.nextPageToken = comments.has_continuation ? comments : null
        this.isLoading = false
        this.showComments = true
        this.apiUsed = 'local'
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendFallback && this.backendPreference === 'local') {
          if (this.fallbackPreference === 'invidious') {
            showToast(this.$t('Falling back to Invidious API'))
            this.getCommentDataInvidious()
          } else if (this.fallbackPreference === 'piped') {
            showToast(this.$t('Falling back to Piped API'))
            this.getCommentDataPiped()
          }
        } else {
          this.isLoading = false
        }
      }
    },

    getCommentRepliesLocal: async function (index) {
      showToast(this.$t('Comments.Getting comment replies, please wait'))

      try {
        const comment = this.commentData[index]
        /** @type {import('youtubei.js').YTNodes.CommentThread} */
        const commentThread = this.replyTokens.get(comment.id)

        if (commentThread == null) {
          this.replyTokens.delete(comment.id)
          comment.hasReplyToken = false
          return
        }

        if (comment.replies.length > 0) {
          await commentThread.getContinuation()
          comment.replies = comment.replies.concat(commentThread.replies.map(reply => parseLocalComment(reply)))
        } else {
          await commentThread.getReplies()
          comment.replies = commentThread.replies.map(reply => parseLocalComment(reply))
        }

        if (commentThread.has_continuation) {
          this.replyTokens.set(comment.id, commentThread)
          comment.hasReplyToken = true
        } else {
          this.replyTokens.delete(comment.id)
          comment.hasReplyToken = false
        }

        comment.showReplies = true
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendFallback && this.backendPreference === 'local') {
          if (this.fallbackPreference === 'invidious') {
            showToast(this.$t('Falling back to Invidious API'))
            this.getCommentDataInvidious()
          } else if (this.fallbackPreference === 'piped') {
            showToast(this.$t('Falling back to Piped API'))
            this.getCommentDataPiped()
          }
        } else {
          this.isLoading = false
        }
      }
    },

    getCommentDataPiped: async function () {
      try {
        const { comments, continuation } = await getPipedComments(this.id)
        comments.map((fullComment) => {
          // Use destructuring to create a new object without the replyToken
          const { replyToken, ...comment } = fullComment
          if (comment.hasReplyToken) {
            this.replyTokens.set(comment.id, replyToken)
          } else {
            this.replyTokens.delete(comment.id)
          }
          return comment
        })
        this.commentData = comments
        this.nextPageToken = continuation
        this.isLoading = false
        this.showComments = true
        this.apiUsed = 'piped'
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Piped API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendFallback && this.backendPreference === 'piped') {
          if (this.fallbackPreference === 'invidious') {
            showToast(this.$t('Falling back to Invidious API'))
            this.getCommentDataInvidious()
          } else if (process.env.SUPPORTS_LOCAL_API && this.fallbackPreference === 'local') {
            showToast(this.$t('Falling back to Local API'))
            this.getCommentDataLocal()
          }
        } else {
          this.isLoading = false
        }
      }
    },

    getCommentDataPipedMore: async function(token, index = null) {
      try {
        const { comments, continuation } = await getPipedCommentsMore({
          videoId: this.id,
          continuation: token
        })
        if (index !== null) {
          const comment = this.commentData[index]
          comment.replies = comment.replies.concat(comments)
          comment.showReplies = true
          if (comment.hasReplyToken) {
            this.replyTokens.set(comment.id, continuation)
            comment.hasReplyToken = true
          } else {
            this.replyTokens.delete(comment.id)
            comment.hasReplyToken = false
          }
        } else {
          this.commentData = this.commentData.concat(comments)
          this.nextPageToken = continuation
        }
        this.isLoading = false
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Piped API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendFallback && this.backendPreference === 'piped') {
          if (this.fallbackPreference === 'invidious') {
            showToast(this.$t('Falling back to Invidious API'))
            this.getCommentDataInvidious()
          } else if (process.env.SUPPORTS_LOCAL_API && this.fallbackPreference === 'local') {
            showToast(this.$t('Falling back to Local API'))
            this.getCommentDataLocal()
          }
        } else {
          this.isLoading = false
        }
      }
    },

    getCommentDataInvidious: function () {
      invidiousGetComments({
        id: this.id,
        nextPageToken: this.nextPageToken,
        sortNewest: this.sortNewest
      }).then(({ response, commentData }) => {
        commentData = commentData.map(({ replyToken, ...comment }) => {
          if (comment.hasReplyToken) {
            this.replyTokens.set(comment.id, replyToken)
          } else {
            this.replyTokens.delete(comment.id)
          }

          return comment
        })

        this.commentData = this.commentData.concat(commentData)
        this.nextPageToken = response.continuation
        this.isLoading = false
        this.showComments = true
        this.apiUsed = 'invidious'
      }).catch((err) => {
        // region No comment detection
        // No comment related info when video info requested earlier in parent component
        if (err.message.includes('Comments not found')) {
          // For videos without any comment (comment disabled?)
          // e.g. https://youtu.be/8NBSwDEf8a8
          this.commentData = []
          this.nextPageToken = null
          this.isLoading = false
          this.showComments = true
          return
        }
        // endregion No comment detection

        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })

        if (this.backendFallback && this.backendPreference === 'invidious') {
          if (this.fallbackPreference === 'piped') {
            showToast(this.$t('Falling back to Piped API'))
            this.getCommentDataPiped()
          } else if (process.env.SUPPORTS_LOCAL_API && this.fallbackPreference === 'local') {
            showToast(this.$t('Falling back to Local API'))
            this.getCommentDataLocal()
          }
        } else {
          this.isLoading = false
        }
      })
    },

    getCommentRepliesInvidious: function (index) {
      showToast(this.$t('Comments.Getting comment replies, please wait'))

      const comment = this.commentData[index]
      const replyToken = this.replyTokens.get(comment.id)

      invidiousGetCommentReplies({ id: this.id, replyToken: replyToken })
        .then(({ commentData, continuation }) => {
          comment.replies = comment.replies.concat(commentData)
          comment.showReplies = true

          if (continuation) {
            this.replyTokens.set(comment.id, continuation)
            comment.hasReplyToken = true
          } else {
            this.replyTokens.delete(comment.id)
            comment.hasReplyToken = false
          }

          this.isLoading = false
        }).catch((error) => {
          console.error(error)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${error}`, 10000, () => {
            copyToClipboard(error)
          })
          this.isLoading = false
        })
    },

    getPostCommentsInvidious: function() {
      const nextPageToken = this.nextPageToken

      const fetchComments = nextPageToken == null
        ? getInvidiousCommunityPostComments({ postId: this.id, authorId: this.postAuthorId })
        : getInvidiousCommunityPostCommentReplies({ postId: this.id, replyToken: this.nextPageToken, authorId: this.postAuthorId })

      fetchComments.then(({ response, commentData, continuation }) => {
        commentData = commentData.map(({ replyToken, ...comment }) => {
          if (comment.hasReplyToken) {
            this.replyTokens.set(comment.id, replyToken)
          } else {
            this.replyTokens.delete(comment.id)
          }

          return comment
        })

        this.commentData = this.commentData.concat(commentData)
        this.nextPageToken = response?.continuation ?? continuation
        this.isLoading = false
        this.showComments = true
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        this.isLoading = false
      })
    },

    getPostCommentRepliesInvidious: function(index) {
      showToast(this.$t('Comments.Getting comment replies, please wait'))

      const comment = this.commentData[index]
      const replyToken = this.replyTokens.get(comment.id)
      const id = this.id

      getInvidiousCommunityPostCommentReplies({ postId: id, replyToken: replyToken, authorId: this.postAuthorId })
        .then(({ commentData, continuation }) => {
          comment.replies = comment.replies.concat(commentData)
          comment.showReplies = true

          if (continuation) {
            this.replyTokens.set(comment.id, continuation)
            comment.hasReplyToken = true
          } else {
            this.replyTokens.delete(comment.id)
            comment.hasReplyToken = false
          }

          this.isLoading = false
        }).catch((error) => {
          console.error(error)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${error}`, 10000, () => {
            copyToClipboard(error)
          })
          this.isLoading = false
        })
    }
  }
})
