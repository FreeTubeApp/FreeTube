import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

export default Vue.extend({
  name: 'Search',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-input': FtInput,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox,
    'ft-channel-bubble': FtChannelBubble,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      isLoading: false,
      isElementListLoading: false,
      currentTab: 'videos',
      id: '',
      channelName: '',
      bannerUrl: '',
      thumbnailUrl: '',
      subCount: 0,
      latestVideosPage: 2,
      searchPage: 2,
      playlistContinuationString: '',
      channelDescription: '',
      videoSortBy: 'newest',
      playlistSortBy: 'last',
      lastSearchQuery: '',
      relatedChannels: [],
      latestVideos: [],
      latestPlaylists: [],
      searchResults: [],
      shownElementList: [],
      videoSelectNames: [
        'Newest',
        'Oldest',
        'Most Popular'
      ],
      videoSelectValues: [
        'newest',
        'oldest',
        'popular'
      ],
      playlistSelectNames: [
        'Last Video Added',
        'Newest',
        'Oldest'
      ],
      playlistSelectValues: [
        'last',
        'newest',
        'oldest'
      ]
    }
  },
  computed: {
    sessionSearchHistory: function () {
      return this.$store.getters.getSessionSearchHistory
    },

    formattedSubCount: function () {
      return this.subCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  },
  watch: {
    videoSortBy () {
      this.isElementListLoading = true
      this.latestVideos = []
      this.latestVideosPage = 1
      this.channelNextPage()
    },

    playlistSortBy () {
      this.isElementListLoading = true
      this.latestPlaylists = []
      this.playlistContinuationString = ''
      this.getPlaylists()
    }
  },
  mounted: function () {
    this.id = this.$route.params.id

    this.getChannelInfo()
    this.getPlaylists()
  },
  methods: {
    getChannelInfo: function () {
      this.isLoading = true

      this.$store.dispatch('invidiousGetChannelInfo', this.id).then((response) => {
        console.log(response)
        this.channelName = response.author
        this.id = response.authorId
        this.subCount = response.subCount
        this.thumbnailUrl = response.authorThumbnails[3].url
        this.bannerUrl = response.authorBanners[0].url
        this.channelDescription = response.description
        this.relatedChannels = response.relatedChannels
        this.latestVideos = response.latestVideos
        this.isLoading = false
      }).catch((error) => {
        console.log(error)
        this.isLoading = false
      })
    },

    channelNextPage: function () {
      const payload = {
        resource: 'channels/videos',
        id: this.id,
        params: {
          sort_by: this.videoSortBy,
          page: this.latestVideosPage
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        this.latestVideos = this.latestVideos.concat(response)
        this.latestVideosPage++
        this.isElementListLoading = false
      })
    },

    getPlaylists: function () {
      if (this.playlistContinuationString === null) {
        console.log('There are no more playlists available for this channel')
        return
      }

      const payload = {
        resource: 'channels/playlists',
        id: this.id,
        params: {
          sort_by: this.playlistSortBy,
          continuation: this.playlistContinuationString
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        this.playlistContinuationString = response.continuation
        this.latestPlaylists = this.latestPlaylists.concat(response.playlists)
        this.isElementListLoading = false
      }).catch((error) => {
        console.log(error)
      })
    },

    handleSubscription: function () {
      console.log('TODO: Channel handleSubscription')
    },

    handleFetchMore: function () {
      switch (this.currentTab) {
        case 'videos':
          this.channelNextPage()
          break
        case 'playlists':
          this.getPlaylists()
          break
        case 'search':
          this.searchChannel()
          break
      }
    },

    changeTab: function (tab) {
      this.currentTab = tab
    },

    newSearch: function (query) {
      this.lastSearchQuery = query
      this.isElementListLoading = true
      this.searchPage = 1
      this.searchResults = []
      this.changeTab('search')
      this.searchChannel()
    },

    searchChannel: function () {
      const payload = {
        resource: 'channels/search',
        id: this.id,
        params: {
          q: this.lastSearchQuery,
          page: this.searchPage
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        this.searchResults = this.searchResults.concat(response)
        this.isElementListLoading = false
        this.searchPage++
      })
    }
  }
})
