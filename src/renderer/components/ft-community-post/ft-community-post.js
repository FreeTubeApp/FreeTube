import Vue from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtListPlaylist from '../ft-list-playlist/ft-list-playlist.vue'

import autolinker from 'autolinker'
import VueTinySlider from 'vue-tiny-slider'

import {
  toLocalePublicationString
} from '../../helpers/utils'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'

import 'tiny-slider/dist/tiny-slider.css'

export default Vue.extend({
  name: 'FtCommunityPost',
  components: {
    'ft-list-playlist': FtListPlaylist,
    'ft-list-video': FtListVideo,
    'tiny-slider': VueTinySlider
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    playlistId: {
      type: String,
      default: null
    },
    forceListType: {
      type: String,
      default: null
    },
    appearance: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      postText: '',
      postId: '',
      authorThumbnails: null,
      publishedText: '',
      voteCount: '',
      postContent: '',
      commentCount: '',
      isLoading: true,
      author: ''
    }
  },
  computed: {
    tinySliderOptions: function() {
      return {
        items: 1,
        arrowKeys: false,
        controls: false,
        autoplay: false,
        slideBy: 'page',
        navPosition: 'bottom'
      }
    },

    listType: function () {
      return this.$store.getters.getListType
    }
  },
  mounted: function () {
    this.parseVideoData()
  },
  methods: {
    parseVideoData: function () {
      if ('backstagePostThreadRenderer' in this.data) {
        this.postText = 'Shared post'
        this.type = 'text'
        let authorThumbnails = ['', 'https://yt3.ggpht.com/ytc/AAUvwnjm-0qglHJkAHqLFsCQQO97G7cCNDuDLldsrn25Lg=s88-c-k-c0x00ffffff-no-rj']
        if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
          authorThumbnails = authorThumbnails.map(thumbnail => {
            thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
            return thumbnail
          })
        }
        this.authorThumbnails = authorThumbnails
        return
      }
      this.postText = autolinker.link(this.data.postText)
      let authorThumbnails = this.data.authorThumbnails
      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        authorThumbnails = authorThumbnails.map(thumbnail => {
          thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
          return thumbnail
        })
      } else {
        authorThumbnails = authorThumbnails.map(thumbnail => {
          if (thumbnail.url.startsWith('//')) {
            thumbnail.url = 'https:' + thumbnail.url
          }
          return thumbnail
        })
      }
      this.authorThumbnails = authorThumbnails
      this.postContent = this.data.postContent
      this.postId = this.data.postId
      this.publishedText = toLocalePublicationString({
        publishText: this.data.publishedText,
        isLive: this.isLive,
        isUpcoming: this.isUpcoming,
        isRSS: this.data.isRSS
      })
      this.voteCount = this.data.voteCount
      this.commentCount = this.data.commentCount
      this.type = (this.data.postContent !== null && this.data.postContent !== undefined) ? this.data.postContent.type : 'text'
      this.author = this.data.author
      this.isLoading = false
    },

    getBestQualityImage(imageArray) {
      const imageArrayCopy = Array.from(imageArray)
      imageArrayCopy.sort((a, b) => {
        return Number.parseInt(b.width) - Number.parseInt(a.width)
      })

      return imageArrayCopy.at(0)?.url ?? ''
    }
  }
})
