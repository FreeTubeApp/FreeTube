import { defineComponent } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import packageDetails from '../../../../package.json'
import { getHashtagLocal, parseLocalListVideo } from '../../helpers/api/local'
import { isNullOrEmpty } from '../../helpers/utils'

export default defineComponent({
  name: 'Hashtag',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList,
    'ft-flex-box': FtFlexBox,
    'ft-loader': FtLoader
  },
  data: function() {
    return {
      hashtag: '',
      hashtagContinuationData: null,
      videos: [],
      apiUsed: 'local',
      isLoading: true
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    showFetchMoreButton() {
      return !isNullOrEmpty(this.hashtagContinuationData)
    }
  },
  watch: {
    $route() {
      this.isLoading = true
      this.hashtag = ''
      this.hashtagContinuationData = null
      this.videos = []
      this.apiUsed = 'local'
      this.getHashtag()
    }
  },
  mounted: function() {
    this.isLoading = true
    this.getHashtag()
  },
  methods: {
    getHashtag: async function() {
      const hashtag = this.$route.params.hashtag
      if (this.backendFallback || this.backendPreference === 'local') {
        await this.getLocalHashtag(hashtag)
      } else {
        this.getInvidiousHashtag(hashtag)
      }
      document.title = `${this.hashtag} - ${packageDetails.productName}`
    },
    getInvidiousHashtag: function(hashtag) {
      this.hashtag = '#' + hashtag
      this.apiUsed = 'Invidious'
      this.isLoading = false
    },

    getLocalHashtag: async function(hashtag) {
      const hashtagData = await getHashtagLocal(hashtag)
      this.hashtag = hashtagData.header.hashtag
      this.videos = hashtagData.contents.contents.filter(item =>
        item.type !== 'ContinuationItem'
      ).map(item =>
        parseLocalListVideo(item.content)
      )
      this.apiUsed = 'local'
      this.hashtagContinuationData = hashtagData.has_continuation ? hashtagData : null
      this.isLoading = false
    },

    getLocalHashtagMore: async function() {
      const continuation = await this.hashtagContinuationData.getContinuationData()
      const newVideos = continuation.on_response_received_actions[0].contents.filter(item =>
        item.type !== 'ContinuationItem'
      ).map(item =>
        parseLocalListVideo(item.content)
      )
      this.hashtagContinuationData = continuation.has_continuation ? continuation : null
      this.videos = this.videos.concat(newVideos)
    },

    handleFetchMore: function() {
      if (this.apiUsed === 'local') {
        this.getLocalHashtagMore()
      }
    }
  }
})
