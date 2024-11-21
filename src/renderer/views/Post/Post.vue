<template>
  <div>
    <div v-if="!isInvidiousAllowed">
      {{ $t('Channel.Community.Viewing Posts Only Supported By Invidious') }}
    </div>
    <FtLoader v-else-if="isLoading" />
    <template
      v-else
    >
      <FtCard>
        <FtCommunityPost
          :data="post"
          :single-post="true"
          appearance="result"
        />
      </FtCard>
      <CommentSection
        :id="post.postId"
        :channel-name="post.author"
        :post-author-id="authorId"
        :video-player-ready="false"
        :force-state="null"
        :is-post-comments="true"
        :channel-thumbnail="post.authorThumbnails[0].url"
        :show-sort-by="false"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtCommunityPost from '../../components/FtCommunityPost/FtCommunityPost.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import CommentSection from '../../components/CommentSection/CommentSection.vue'
import store from '../../store/index'
import { useRoute, useRouter } from 'vue-router/composables'
import { getInvidiousCommunityPost } from '../../helpers/api/invidious'

const router = useRouter()
const route = useRoute()

const id = ref('')
const authorId = ref('')
const post = shallowRef(null)
const isLoading = ref(true)

/** @type {import('vue').ComputedRef<'invidious' | 'local'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => {
  return store.getters.getBackendFallback
})

const isInvidiousAllowed = computed(() => {
  return backendPreference.value === 'invidious' || backendFallback.value
})

onMounted(async () => {
  if (isInvidiousAllowed.value) {
    id.value = route.params.id
    authorId.value = route.query.authorId
    await loadDataInvidiousAsync()
  }
})

async function loadDataInvidiousAsync() {
  post.value = await getInvidiousCommunityPost(id.value, authorId.value)
  authorId.value = post.value.authorId
  isLoading.value = false

  // If the authorId is missing from the URL we should add it,
  // that way if the user comes back to this page by pressing the back button
  // we don't have to resolve the authorId again
  if (authorId.value !== route.query.authorId) {
    router.replace({
      path: `/post/${id.value}`,
      query: {
        authorId: authorId.value
      }
    })
  }
}

watch(() => route.params.id, async () => {
  // react to route changes...
  isLoading.value = true
  if (isInvidiousAllowed.value) {
    id.value = route.params.id
    authorId.value = route.query.authorId
    await loadDataInvidiousAsync()
  }
})
</script>
