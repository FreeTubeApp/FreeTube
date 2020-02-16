import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import ytct from 'youtube-comments-task'

export default Vue.extend({
  name: 'WatchVideoComments',
  components: {
    'ft-card': FtCard,
    'ft-loader': FtLoader
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      isLoading: false,
      nextPageToken: null,
      commentData: []
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
    }
  },
  methods: {
    getCommentData: function () {
      this.isLoading = true
      switch (this.backendPreference) {
        case 'local':
          this.getCommentDataLocal()
          break
        case 'invidious':
          this.getCommentDataInvidious(this.nextPageToken)
          break
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

    getCommentDataLocal: function () {
      console.log('Getting comment data please wait...')
      ytct(this.id, this.nextPageToken).fork(e => {
        console.error('ERROR', e)
        if (this.backendFallback && this.backendPreference === 'local') {
          console.log('Falling back to Invidious API')
          this.getCommentDataInvidious()
        } else {
          this.isLoading = false
        }
      },
      p => {
        const commentData = p.comments.map((comment) => {
          comment.showReplies = false
          comment.authorId = comment.authorLink.replace('/channel/', '')
          comment.authorId = comment.authorId.replace('/user/', '')
          comment.dataType = 'local'

          return comment
        })
        console.log(commentData)
        this.commentData = this.commentData.concat(commentData)
        this.nextPageToken = p.nextPageToken
        this.isLoading = false
      })
    },

    getCommentDataInvidious: function () {
      const payload = {
        resource: 'comments',
        id: this.id,
        params: {
          continuation: this.nextPageToken
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        console.log(response)

        const commentData = response.comments.map((comment) => {
          comment.showReplies = false
          comment.authorThumb = comment.authorThumbnails[1].url
          comment.likes = comment.likeCount
          comment.text = comment.content
          comment.date = comment.publishedText
          comment.dataType = 'invidious'

          if (typeof (comment.replies) !== 'undefined' && typeof (comment.replies.replyCount) !== 'undefined') {
            comment.numReplies = comment.replies.replyCount
            comment.replyContinuation = comment.replies.continuation
          } else {
            comment.numReplies = 0
            comment.replyContinuation = ''
          }

          comment.replies = []

          return comment
        })

        console.log(commentData)
        this.commentData = this.commentData.concat(commentData)
        this.nextPageToken = response.continuation
        this.isLoading = false
      }).catch((xhr) => {
        console.log('found an error')
        console.log(xhr)
        if (this.backendFallback && this.backendPreference === 'invidious') {
          console.log('Falling back to local API')
          this.getCommentDataLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    getCommentRepliesInvidious: function (index) {
      console.log('Getting comment replies')
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
          comment.authorThumb = comment.authorThumbnails[1].url
          comment.likes = comment.likeCount
          comment.text = comment.content
          comment.date = comment.publishedText
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
        this.isLoading = false
      })
    }
  }
})
