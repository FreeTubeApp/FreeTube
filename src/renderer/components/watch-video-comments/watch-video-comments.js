import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtTimestampCatcher from '../../components/ft-timestamp-catcher/ft-timestamp-catcher.vue'
import autolinker from 'autolinker'
import CommentScraper from 'yt-comment-scraper'

export default Vue.extend({
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
    channelThumbnail: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      isLoading: false,
      showComments: false,
      commentScraper: null,
      nextPageToken: null,
      commentData: [],
      sortNewest: false
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },
    hideCommentLikes: function () {
      return this.$store.getters.getHideCommentLikes
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
    }
  },
  methods: {
    onTimestamp: function (timestamp) {
      this.$emit('timestamp-event', timestamp)
    },

    handleSortChange: function (sortType) {
      this.sortNewest = !this.sortNewest
      switch (this.backendPreference) {
        case 'local':
          this.getCommentDataLocal(true)
          break
        case 'invidious':
          this.isLoading = true
          this.commentData = []
          this.getCommentDataInvidious(null)
          break
      }
    },

    getCommentData: function (sortChanged = false) {
      this.isLoading = true
      switch (this.backendPreference) {
        case 'local':
          this.getCommentDataLocal(sortChanged)
          break
        case 'invidious':
          this.getCommentDataInvidious(this.nextPageToken)
          break
      }
    },

    getMoreComments: function () {
      if (this.commentData.length === 0 || this.nextPageToken === null || typeof this.nextPageToken === 'undefined') {
        this.showToast({
          message: this.$t('Comments.There are no more comments for this video')
        })
        this.getCommentData()
      } else {
        this.getCommentData()
      }
    },

    getCommentReplies: function (index) {
      switch (this.commentData[index].dataType) {
        case 'local':
          this.commentData[index].showReplies = !this.commentData[index].showReplies
          break
        case 'invidious':
          if (this.commentData[index].showReplies || this.commentData[index].replies.length > 0) {
            this.commentData[index].showReplies = !this.commentData[index].showReplies
          } else {
            this.getCommentRepliesInvidious(index)
          }
          break
      }
    },

    getCommentDataLocal: function (sortChanged = false) {
      if (this.commentScraper === null || sortChanged === true) {
        this.commentScraper = new CommentScraper(false, this.sortNewest)
        this.commentData = []
      }
      this.commentScraper.scrape_next_page_youtube_comments(this.id).then((response) => {
        if (response === null) {
          this.showToast({
            message: this.$t('Comments.No more comments available'),
            time: 7000,
            action: () => {
            }
          })
          this.isLoading = false
          return
        }
        console.log(response)
        const commentData = response.map((comment) => {
          comment.showReplies = false
          comment.dataType = 'local'
          this.toLocalePublicationString({
            publishText: (comment.time + ' ago'),
            templateString: this.$t('Video.Publicationtemplate'),
            timeStrings: this.$t('Video.Published'),
            liveStreamString: this.$t('Video.Watching'),
            upcomingString: this.$t('Video.Published.Upcoming'),
            isLive: false,
            isUpcoming: false,
            isRSS: false
          }).then((data) => {
            comment.time = data
          }).catch((error) => {
            console.error(error)
          })
          if (this.hideCommentLikes) {
            comment.likes = null
          }
          comment.text = autolinker.link(comment.text)
          comment.replies.forEach((reply) => {
            reply.text = autolinker.link(reply.text)
          })
          return comment
        })
        this.commentData = this.commentData.concat(commentData)
        this.isLoading = false
        this.showComments = true
        this.nextPageToken = ''
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(err)
          }
        })
        if (this.backendFallback && this.backendPreference === 'local') {
          this.showToast({
            message: this.$t('Falling back to Invidious API')
          })
          this.getCommentDataInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getCommentDataInvidious: function () {
      const payload = {
        resource: 'comments',
        id: this.id,
        params: {
          continuation: this.nextPageToken,
          sort_by: this.sortNewest ? 'new' : 'top'
        }
      }

      this.invidiousAPICall(payload).then((response) => {
        console.log(response)

        const commentData = response.comments.map((comment) => {
          comment.showReplies = false
          comment.authorThumb = comment.authorThumbnails[1].url.replace('https://yt3.ggpht.com', `${this.invidiousInstance}/ggpht/`)
          if (this.hideCommentLikes) {
            comment.likes = null
          } else {
            comment.likes = comment.likeCount
          }
          comment.text = autolinker.link(comment.content)
          comment.dataType = 'invidious'

          if (typeof (comment.replies) !== 'undefined' && typeof (comment.replies.replyCount) !== 'undefined') {
            comment.numReplies = comment.replies.replyCount
            comment.replyContinuation = comment.replies.continuation
          } else {
            comment.numReplies = 0
            comment.replyContinuation = ''
          }

          comment.replies = []

          comment.time = comment.publishedText

          return comment
        })

        console.log(commentData)
        this.commentData = this.commentData.concat(commentData)
        this.nextPageToken = response.continuation
        this.isLoading = false
        this.showComments = true
      }).catch((xhr) => {
        console.log('found an error')
        console.log(xhr)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${xhr.responseText}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(xhr.responseText)
          }
        })
        if (this.backendFallback && this.backendPreference === 'invidious') {
          this.showToast({
            message: this.$t('Falling back to local API')
          })
          this.getCommentDataLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    getCommentRepliesInvidious: function (index) {
      this.showToast({
        message: this.$t('Comments.Getting comment replies, please wait')
      })
      const payload = {
        resource: 'comments',
        id: this.id,
        params: {
          continuation: this.commentData[index].replyContinuation
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        console.log(response)

        const commentData = response.comments.map((comment) => {
          comment.showReplies = false
          comment.authorThumb = comment.authorThumbnails[1].url.replace('https://yt3.ggpht.com', `${this.invidiousInstance}/ggpht/`)
          if (this.hideCommentLikes) {
            comment.likes = null
          } else {
            comment.likes = comment.likeCount
          }
          comment.text = autolinker.link(comment.content)
          comment.time = comment.publishedText
          comment.dataType = 'invidious'
          comment.numReplies = 0
          comment.replyContinuation = ''
          comment.replies = []

          return comment
        })

        console.log(commentData)
        this.commentData[index].replies = commentData
        this.commentData[index].showReplies = true
        this.isLoading = false
      }).catch((xhr) => {
        console.log('found an error')
        console.log(xhr)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${xhr.responseText}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(xhr.responseText)
          }
        })
        this.isLoading = false
      })
    },

    ...mapActions([
      'showToast',
      'toLocalePublicationString',
      'invidiousAPICall'
    ])
  }
})
