import { defineComponent } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtTimestampCatcher from '../../components/ft-timestamp-catcher/ft-timestamp-catcher.vue'
import { copyToClipboard, showToast } from '../../helpers/utils'
import { invidiousGetCommentReplies, invidiousGetComments } from '../../helpers/api/invidious'
import { getLocalComments, parseLocalComment } from '../../helpers/api/local'

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
  },
  data: function () {
    return {
      isLoading: false,
      showComments: false,
      nextPageToken: null,
      commentData: [],
      sortNewest: false,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    hideCommentLikes: function () {
      return this.$store.getters.getHideCommentLikes
    },

    commentAutoLoadEnabled: function () {
      return this.$store.getters.getCommentAutoLoadEnabled
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

    observeVisibilityOptions: function() {
      if (!this.commentAutoLoadEnabled) { return false }
      if (!this.videoPlayerReady) { return false }

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

    canPerformInitialCommentLoading: function() {
      return this.commentData.length === 0 && !this.isLoading && !this.showComments
    },

    canPerformMoreCommentLoading: function() {
      return this.commentData.length > 0 && !this.isLoading && this.showComments && this.nextPageToken
    },
  },
  mounted: function () {
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
      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        this.getCommentDataInvidious()
      } else {
        this.getCommentDataLocal()
      }
    },

    getMoreComments: function () {
      if (this.commentData.length === 0 || this.nextPageToken === null || typeof this.nextPageToken === 'undefined') {
        showToast(this.$t('Comments.There are no more comments for this video'))
      } else {
        if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
          this.getCommentDataInvidious()
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
      if (process.env.IS_ELECTRON) {
        switch (this.commentData[index].dataType) {
          case 'local':
            this.getCommentRepliesLocal(index)
            break
          case 'invidious':
            this.getCommentRepliesInvidious(index)
            break
        }
      } else {
        this.getCommentRepliesInvidious(index)
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
          .map(commentThread => parseLocalComment(commentThread.comment, commentThread))

        if (more) {
          this.commentData = this.commentData.concat(parsedComments)
        } else {
          this.commentData = parsedComments
        }

        this.nextPageToken = comments.has_continuation ? comments : null
        this.isLoading = false
        this.showComments = true
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendFallback && this.backendPreference === 'local') {
          showToast(this.$t('Falling back to Invidious API'))
          this.getCommentDataInvidious()
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
        const commentThread = comment.replyToken

        if (comment.replies.length > 0) {
          await commentThread.getContinuation()
          comment.replies = comment.replies.concat(commentThread.replies.map(reply => parseLocalComment(reply)))
        } else {
          await commentThread.getReplies()
          comment.replies = commentThread.replies.map(reply => parseLocalComment(reply))
        }

        comment.replyToken = commentThread.has_continuation ? commentThread : null
        comment.showReplies = true
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendFallback && this.backendPreference === 'local') {
          showToast(this.$t('Falling back to Invidious API'))
          this.getCommentDataInvidious()
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
        this.commentData = this.commentData.concat(commentData)
        this.nextPageToken = response.continuation
        this.isLoading = false
        this.showComments = true
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
        if (process.env.IS_ELECTRON && this.backendFallback && this.backendPreference === 'invidious') {
          showToast(this.$t('Falling back to local API'))
          this.getCommentDataLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    getCommentRepliesInvidious: function (index) {
      showToast(this.$t('Comments.Getting comment replies, please wait'))
      const replyToken = this.commentData[index].replyToken
      invidiousGetCommentReplies({ id: this.id, replyToken: replyToken })
        .then(({ commentData, continuation }) => {
          this.commentData[index].replies = this.commentData[index].replies.concat(commentData)
          this.commentData[index].showReplies = true
          this.commentData[index].replyToken = continuation
          this.isLoading = false
        }).catch((xhr) => {
          console.error(xhr)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${xhr.responseText}`, 10000, () => {
            copyToClipboard(xhr.responseText)
          })
          this.isLoading = false
        })
    },
  }
})
