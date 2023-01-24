import { defineComponent } from 'vue'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'

import autolinker from 'autolinker'
import { getRandomColorClass } from '../../helpers/colors'
import { getLocalVideoInfo, parseLocalTextRuns } from '../../helpers/api/local'

export default defineComponent({
  name: 'WatchVideoLiveChat',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-button': FtButton
  },
  props: {
    liveChat: {
      type: EventTarget,
      default: null
    },
    videoId: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      liveChatInstance: null,
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
        id: '',
        author: {
          name: '',
          thumbnailUrl: ''
        },
        message: '',
        superChat: {
          amount: '',
          colorClass: ''
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

    scrollingBehaviour: function () {
      return this.$store.getters.getDisableSmoothScrolling ? 'auto' : 'smooth'
    }
  },
  beforeDestroy: function () {
    this.hasEnded = true
    this.liveChatInstance?.stop()
    this.liveChatInstance = null
  },
  created: function () {
    if (!process.env.IS_ELECTRON) {
      this.hasError = true
      this.errorMessage = this.$t('Video["Live Chat is currently not supported in this build."]')
    } else {
      switch (this.backendPreference) {
        case 'local':
          this.liveChatInstance = this.liveChat
          this.startLiveChatLocal()
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

    getLiveChatLocal: async function () {
      const videoInfo = await getLocalVideoInfo(this.videoId)
      this.liveChatInstance = videoInfo.getLiveChat()

      this.startLiveChatLocal()
    },

    startLiveChatLocal: function () {
      this.liveChatInstance.once('start', initialData => {
        /**
         * @type {import ('youtubei.js/dist/src/parser/index').LiveChatContinuation}
         */
        const liveChatContinuation = initialData

        const actions = liveChatContinuation.actions.filter(action => action.type === 'AddChatItemAction')

        for (const { item } of actions) {
          switch (item.type) {
            case 'LiveChatTextMessage':
              this.parseLiveChatComment(item)
              break
            case 'LiveChatPaidMessage':
              this.parseLiveChatSuperChat(item)
          }
        }

        this.isLoading = false

        setTimeout(() => {
          this.$refs.liveChatComments?.scrollTo({
            top: this.$refs.liveChatComments.scrollHeight,
            behavior: 'instant'
          })
        })
      })

      this.liveChatInstance.on('chat-update', action => {
        if (this.hasEnded) {
          return
        }
        if (action.type === 'AddChatItemAction') {
          switch (action.item.type) {
            case 'LiveChatTextMessage':
              this.parseLiveChatComment(action.item)
              break
            case 'LiveChatPaidMessage':
              this.parseLiveChatSuperChat(action.item)
              break
          }
        }
      })

      this.liveChatInstance.once('end', () => {
        this.hasEnded = true
        this.liveChatInstance = null
      })

      this.liveChatInstance.once('error', error => {
        this.liveChatInstance.stop()
        this.liveChatInstance = null
        console.error(error)
        this.errorMessage = error
        this.hasError = true
        this.isLoading = false
        this.hasEnded = true
      })

      this.liveChatInstance.start()
    },

    /**
     * @param {import('youtubei.js/dist/src/parser/classes/livechat/items/LiveChatTextMessage').default} comment
     */
    parseLiveChatComment: function (comment) {
      /**
       * can also be undefined if there is no badge
       * @type {import('youtubei.js/dist/src/parser/classes/LiveChatAuthorBadge').default}
       */
      const badge = comment.author.badges.find(badge => badge.type === 'LiveChatAuthorBadge' && badge.custom_thumbnail)

      const parsedComment = {
        message: autolinker.link(parseLocalTextRuns(comment.message.runs, 20)),
        author: {
          name: comment.author.name.text,
          thumbnailUrl: comment.author.thumbnails.at(-1).url,
          isOwner: comment.author.id === this.channelId,
          isModerator: comment.author.is_moderator,
          isMember: !!badge
        }
      }

      if (badge) {
        parsedComment.badge = {
          url: badge.custom_thumbnail.at(-1).url,
          tooltip: badge.tooltip ?? ''
        }
      }

      this.pushComment(parsedComment)
    },

    /**
     * @param {import('youtubei.js/dist/src/parser/classes/livechat/items/LiveChatPaidMessage').default} superChat
     */
    parseLiveChatSuperChat: function (superChat) {
      const parsedComment = {
        id: superChat.id,
        message: autolinker.link(parseLocalTextRuns(superChat.message.runs, 20)),
        author: {
          name: superChat.author.name.text,
          thumbnailUrl: superChat.author.thumbnails[0].url
        },
        superChat: {
          amount: superChat.purchase_amount,
          colorClass: getRandomColorClass()
        }
      }

      this.superChatComments.unshift(parsedComment)

      setTimeout(() => {
        this.removeFromSuperChat(parsedComment.id)
      }, 120000)

      this.pushComment(parsedComment)
    },

    pushComment: function (comment) {
      this.comments.push(comment)

      if (!this.isLoading && this.stayAtBottom) {
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
    }
  }
})
