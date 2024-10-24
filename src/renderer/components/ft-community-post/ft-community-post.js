import { defineComponent } from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtListPlaylist from '../ft-list-playlist/ft-list-playlist.vue'
import FtCommunityPoll from '../ft-community-poll/ft-community-poll.vue'

import autolinker from 'autolinker'

import { A11y, Navigation, Pagination } from 'swiper/modules'

import {
  createWebURL,
  deepCopy,
  formatNumber,
  getRelativeTimeFromDate,
  toLocalePublicationString,
} from '../../helpers/utils'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'FtCommunityPost',
  components: {
    'ft-list-playlist': FtListPlaylist,
    'ft-list-video': FtListVideo,
    'ft-community-poll': FtCommunityPoll
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    appearance: {
      type: String,
      required: true
    },
    hideForbiddenTitles: {
      type: Boolean,
      default: true
    },
    singlePost: {
      type: Boolean,
      default: false
    },
  },
  data: function () {
    return {
      postText: '',
      postId: '',
      authorThumbnails: null,
      publishedText: '',
      voteCount: 0,
      formattedVoteCount: '',
      postContent: '',
      commentCount: null,
      formattedCommentCount: '',
      author: '',
      authorId: '',
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    },

    forbiddenTitles() {
      if (!this.hideForbiddenTitles) { return [] }
      return JSON.parse(this.$store.getters.getForbiddenTitles)
    },

    hideVideo() {
      return this.forbiddenTitles.some((text) => this.data.postContent.content.title?.toLowerCase().includes(text.toLowerCase()))
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    fallbackPreference: function () {
      return this.$store.getters.getFallbackPreference
    },
    isInvidiousAllowed: function() {
      return this.backendPreference === 'invidious' || (this.backendFallback && this.fallbackPreference === 'invidious')
    }
  },
  created: function () {
    this.parseCommunityData()
  },
  mounted: function () {
    if (this.type === 'multiImage' && this.postContent.content.length > 0) {
      const swiperContainer = this.$refs.swiperContainer

      /** @type {import('swiper/element').SwiperContainer} */
      const swiperOptions = {
        modules: [A11y, Navigation, Pagination],

        injectStylesUrls: [
          // This file is created with the copy webpack plugin in the web and renderer webpack configs.
          // If you add more modules, please remember to add their CSS files to the list in webpack config files.
          createWebURL(`/swiper-${process.env.SWIPER_VERSION}.css`)
        ],

        a11y: true,
        navigation: true,
        pagination: {
          enabled: true,
          clickable: true
        },
        slidesPerView: 1
      }

      Object.assign(swiperContainer, swiperOptions)

      swiperContainer.initialize()
    }
  },
  methods: {
    parseCommunityData: function () {
      if ('backstagePostThreadRenderer' in this.data) {
        this.postText = 'Shared post'
        this.type = 'text'
        let authorThumbnails = ['', 'https://yt3.ggpht.com/ytc/AAUvwnjm-0qglHJkAHqLFsCQQO97G7cCNDuDLldsrn25Lg=s88-c-k-c0x00ffffff-no-rj']
        if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
          authorThumbnails = authorThumbnails.map(thumbnail => {
            thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
            return thumbnail
          })
        }
        this.authorThumbnails = authorThumbnails
        return
      }
      this.postText = autolinker.link(this.data.postText)
      const authorThumbnails = deepCopy(this.data.authorThumbnails)
      if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
        authorThumbnails.forEach(thumbnail => {
          thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
        })
      } else {
        authorThumbnails.forEach(thumbnail => {
          if (thumbnail.url.startsWith('//')) {
            thumbnail.url = 'https:' + thumbnail.url
          }
        })
      }
      this.authorThumbnails = authorThumbnails
      this.postContent = this.data.postContent
      this.postId = this.data.postId
      this.publishedText = toLocalePublicationString({
        publishText: getRelativeTimeFromDate(this.data.publishedTime),
        isLive: this.isLive,
        isUpcoming: this.isUpcoming,
        isRSS: this.data.isRSS
      })
      this.voteCount = this.data.voteCount
      this.formattedVoteCount = formatNumber(this.voteCount)
      this.commentCount = this.data.commentCount
      this.formattedCommentCount = formatNumber(this.commentCount)
      this.type = (this.data.postContent !== null && this.data.postContent !== undefined) ? this.data.postContent.type : 'text'
      this.author = this.data.author
      this.authorId = this.data.authorId
    },

    getBestQualityImage(imageArray) {
      const imageArrayCopy = Array.from(imageArray)
      imageArrayCopy.sort((a, b) => {
        return Number.parseInt(b.width) - Number.parseInt(a.width)
      })

      // Remove cropping directives when applicable
      return imageArrayCopy.at(0)?.url?.replace(/-c-fcrop64=.*/i, '') ?? ''
    }
  }
})
