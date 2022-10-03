import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'

import autolinker from 'autolinker'
import { LiveChat } from '@freetube/youtube-chat'

export default Vue.extend({
  name: 'WatchVideoLiveChat',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-list-video': FtListVideo
  },
  beforeRouteLeave: function () {
    this.liveChat.stop()
    this.hasEnded = true
  },
  props: {
    videoId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      liveChat: null,
      isLoading: true,
      hasError: false,
      hasEnded: false,
      showEnableChat: false,
      errorMessage: '',
      stayAtBottom: true,
      showSuperChat: false,
      showScrollToBottom: false,
      comments: [],
      superChatComments: [],
      superChat: {
        author: {
          name: '',
          thumbnail: ''
        },
        message: [
          ''
        ],
        superChat: {
          amount: ''
        }
      }
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    chatHeight: function () {
      if (this.superChatComments.length > 0) {
        return '390px'
      } else {
        return '445px'
      }
    },

    hideLiveChat: function () {
      return this.$store.getters.getHideLiveChat
    },

    scrollingBehaviour: function () {
      return this.$store.getters.getDisableSmoothScrolling ? 'auto' : 'smooth'
    }
  },
  created: function () {
    if (!process.env.IS_ELECTRON) {
      this.hasError = true
      this.errorMessage = this.$t('Video["Live Chat is currently not supported in this build."]')
    } else {
      switch (this.backendPreference) {
        case 'local':
          this.getLiveChatLocal()
          break
        case 'invidious':
          if (this.backendFallback) {
            this.getLiveChatLocal()
          } else {
            this.hasError = true
            this.errorMessage = this.$t('Video["Live Chat is currently not supported with the Invidious API.  A direct connection to YouTube is required."]')
            this.showEnableChat = true
            this.isLoading = false
          }
          break
      }
    }
  },
  methods: {
    enableLiveChat: function () {
      this.hasError = false
      this.showEnableChat = false
      this.isLoading = true
      this.getLiveChatLocal()
    },

    getLiveChatLocal: function () {
      this.liveChat = new LiveChat({ liveId: this.videoId })

      this.isLoading = false

      this.liveChat.on('start', (liveId) => {
        this.isLoading = false
      })

      this.liveChat.on('end', (reason) => {
        console.error('Live chat has ended')
        console.error(reason)
        this.hasError = true
        this.showEnableChat = false
        this.errorMessage = this.$t('Video["Chat is disabled or the Live Stream has ended."]')
      })

      this.liveChat.on('error', (err) => {
        this.hasError = true
        this.errorMessage = err
        this.showEnableChat = false
      })

      this.liveChat.on('comment', (comment) => {
        this.parseLiveChatComment(comment)
      })

      this.liveChat.start()
    },

    parseLiveChatComment: function (comment) {
      if (this.hasEnded) {
        return
      }

      comment.messageHtml = ''

      comment.message.forEach((text) => {
        if (typeof text === 'undefined') return

        if (typeof (text.navigationEndpoint) !== 'undefined') {
          if (typeof (text.navigationEndpoint.watchEndpoint) !== 'undefined') {
            const htmlRef = `<a href="https://www.youtube.com/watch?v=${text.navigationEndpoint.watchEndpoint.videoId}">${text.text}</a>`
            comment.messageHtml = comment.messageHtml.replace(/(<([^>]+)>)/ig, '') + htmlRef
          } else {
            comment.messageHtml = (comment.messageHtml + text.text).replace(/(<([^>]+)>)/ig, '')
          }
        } else if (typeof (text.alt) !== 'undefined') {
          const htmlImg = `<img src="${text.url}" alt="${text.alt}" class="liveChatEmoji" height="24" width="24" />`
          comment.messageHtml = comment.messageHtml.replace(/(<([^>]+)>)/ig, '') + htmlImg
        } else {
          comment.messageHtml = (comment.messageHtml + text.text).replace(/(<([^>]+)>)/ig, '')
        }
      })

      comment.messageHtml = autolinker.link(comment.messageHtml)

      if (typeof this.$refs.liveChatComments === 'undefined' && typeof this.$refs.liveChatMessage === 'undefined') {
        console.error("Can't find chat object.  Stopping chat connection")
        this.liveChat.stop()
        return
      }

      this.comments.push(comment)

      if (typeof (comment.superchat) !== 'undefined') {
        this.getRandomColorClass().then((data) => {
          comment.superchat.colorClass = data

          this.superChatComments.unshift(comment)

          setTimeout(() => {
            this.removeFromSuperChat(comment.id)
          }, 120000)
        })
      }

      if (comment.author.name[0] === 'Ge' || comment.author.name[0] === 'Ne') {
        this.getRandomColorClass().then((data) => {
          comment.superChat = {
            amount: '$5.00',
            colorClass: data
          }

          this.superChatComments.unshift(comment)

          setTimeout(() => {
            this.removeFromSuperChat(comment.id)
          }, 120000)
        })
      }

      if (this.stayAtBottom) {
        setTimeout(() => {
          this.$refs.liveChatComments?.scrollTo({
            top: this.$refs.liveChatComments.scrollHeight,
            behavior: this.scrollingBehaviour
          })
        })
      }

      if (this.comments.length > 150 && this.stayAtBottom) {
        this.comments = this.comments.splice(this.comments.length - 150, this.comments.length)
      }
    },

    removeFromSuperChat: function (id) {
      this.superChatComments = this.superChatComments.filter((comment) => {
        return comment.id !== id
      })
    },

    showSuperChatComment: function (comment) {
      if (this.superChat.id === comment.id && this.showSuperChat) {
        this.showSuperChat = false
      } else {
        this.superChat = comment
        this.showSuperChat = true
      }
    },

    onScroll: function (event) {
      const liveChatComments = this.$refs.liveChatComments
      if (event.wheelDelta >= 0 && this.stayAtBottom) {
        this.stayAtBottom = false

        if (liveChatComments.scrollHeight > liveChatComments.clientHeight) {
          this.showScrollToBottom = true
        }
      } else if (event.wheelDelta < 0 && !this.stayAtBottom) {
        if ((liveChatComments.scrollHeight - liveChatComments.scrollTop) === liveChatComments.clientHeight) {
          this.scrollToBottom()
        }
      }
    },

    scrollToBottom: function () {
      this.$refs.liveChatComments.scrollTo({
        top: this.$refs.liveChatComments.scrollHeight,
        behavior: this.scrollingBehaviour
      })
      this.stayAtBottom = true
      this.showScrollToBottom = false
    },

    preventDefault: function (event) {
      event.stopPropagation()
      event.preventDefault()
    },

    ...mapActions([
      'getRandomColorClass'
    ])
  }
})
