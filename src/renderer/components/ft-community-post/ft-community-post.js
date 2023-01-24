import Vue from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import autolinker from 'autolinker'
import VueTinySlider from 'vue-tiny-slider'

import {
  toLocalePublicationString
} from '../../helpers/utils'
export default Vue.extend({
  name: 'FtCommunityPost',
  components: {
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
        arrowKeys: true,
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
        this.authorThumbnails = ['', 'https://yt3.ggpht.com/ytc/AAUvwnjm-0qglHJkAHqLFsCQQO97G7cCNDuDLldsrn25Lg=s88-c-k-c0x00ffffff-no-rj']
        return
      }
      this.postText = autolinker.link(this.data.postText)
      this.authorThumbnails = this.data.authorThumbnails
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
    }
  }
})
