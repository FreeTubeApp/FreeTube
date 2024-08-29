import { defineComponent } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtCommunityPost from '../../components/ft-community-post/ft-community-post.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import WatchVideoComments from '../../components/watch-video-comments/watch-video-comments.vue'

import { getInvidiousCommunityPost } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'Post',
  components: {
    FtCard,
    FtCommunityPost,
    FtLoader,
    WatchVideoComments
  },
  data: function () {
    return {
      id: '',
      authorId: '',
      post: null,
      comments: null,
      isLoading: true,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    isInvidiousAllowed: function() {
      return this.backendPreference === 'invidious' || this.backendFallback
    }
  },
  mounted: async function () {
    if (this.isInvidiousAllowed) {
      this.isLoading = true
      this.id = this.$route.params.id
      this.authorId = this.$route.query.authorId
      await this.loadDataInvidiousAsync()
    }
  },
  methods: {
    loadDataInvidiousAsync: async function() {
      this.post = await getInvidiousCommunityPost(this.id, this.authorId)
      this.authorId = this.post.authorId
      this.isLoading = false
    }
  }
})
