import { defineComponent } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtAutoLoadNextPageWrapper from '../../components/ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import packageDetails from '../../../../package.json'
import { getHashtagLocal, parseLocalListVideo } from '../../helpers/api/local'
import { copyToClipboard, setPublishedTimestampsInvidious, showToast } from '../../helpers/utils'
import { isNullOrEmpty } from '../../helpers/strings'
import { getHashtagInvidious } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'Hashtag',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList,
    'ft-flex-box': FtFlexBox,
    'ft-loader': FtLoader,
    'ft-auto-load-next-page-wrapper': FtAutoLoadNextPageWrapper,
  },
  data: function() {
    return {
      hashtag: '',
      hashtagContinuationData: null,
      videos: [],
      apiUsed: 'local',
      pageNumber: 1,
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
      return !isNullOrEmpty(this.hashtagContinuationData) || this.apiUsed === 'invidious'
    },
  },
  watch: {
    $route() {
      this.resetData()
      this.getHashtag()
    }
  },
  mounted: function() {
    this.resetData()
    this.getHashtag()
  },
  methods: {
    resetData: function() {
      this.isLoading = true
      this.hashtag = ''
      this.hashtagContinuationData = null
      this.videos = []
      this.apiUsed = 'local'
      this.pageNumber = 1
    },

    getHashtag: async function() {
      const hashtag = decodeURIComponent(this.$route.params.hashtag)
      if (this.backendFallback || this.backendPreference === 'local') {
        await this.getLocalHashtag(hashtag)
      } else {
        await this.getInvidiousHashtag(hashtag)
      }
      document.title = `${this.hashtag} - ${packageDetails.productName}`
    },

    getInvidiousHashtag: async function(hashtag, page) {
      try {
        const videos = await getHashtagInvidious(hashtag, page)
        setPublishedTimestampsInvidious(videos)
        this.hashtag = '#' + hashtag
        this.isLoading = false
        this.apiUsed = 'invidious'
        this.videos = this.videos.concat(videos)
        this.pageNumber += 1
      } catch (error) {
        console.error(error)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${error}`, 10000, () => {
          copyToClipboard(error)
        })
        if (process.env.SUPPORTS_LOCAL_API && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.resetData()
          this.getLocalHashtag(hashtag)
        } else {
          this.isLoading = false
        }
      }
    },

    getLocalHashtag: async function(hashtag) {
      try {
        const hashtagData = await getHashtagLocal(hashtag)

        const header = hashtagData.header
        if (header) {
          switch (header.type) {
            case 'HashtagHeader':
              this.hashtag = header.hashtag.toString()
              break
            case 'PageHeader':
              this.hashtag = header.content.title.text
              break
            default:
              console.error(`Unknown hashtag header type: ${header.type}, falling back to query parameter.`)
              this.hashtag = `#${hashtag}`
          }
        } else {
          console.error(' Hashtag header missing, probably a layout change, falling back to query parameter.')
          this.hashtag = `#${hashtag}`
        }

        this.videos = hashtagData.videos.map(parseLocalListVideo)
        this.apiUsed = 'local'
        this.hashtagContinuationData = hashtagData.has_continuation ? hashtagData : null
        this.isLoading = false
      } catch (error) {
        console.error(error)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${error}`, 10000, () => {
          copyToClipboard(error)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.resetData()
          this.getInvidiousHashtag(hashtag)
        } else {
          this.isLoading = false
        }
      }
    },

    getLocalHashtagMore: async function() {
      try {
        const continuation = await this.hashtagContinuationData.getContinuation()
        const newVideos = continuation.videos.map(parseLocalListVideo)
        this.hashtagContinuationData = continuation.has_continuation ? continuation : null
        this.videos = this.videos.concat(newVideos)
      } catch (error) {
        console.error(error)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${error}`, 10000, () => {
          copyToClipboard(error)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          const hashtag = this.hashtag.substring(1)
          this.resetData()
          this.getLocalHashtag(hashtag)
        } else {
          this.isLoading = false
        }
      }
    },

    handleFetchMore: function() {
      if (this.apiUsed === 'local') {
        this.getLocalHashtagMore()
      } else if (this.apiUsed === 'invidious') {
        this.getInvidiousHashtag(this.hashtag.substring(1), this.pageNumber)
      }
    }
  }
})
