<template>
  <div>
    <FtLoader v-if="isLoading" />
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
        :show-sort-by="backendPreference == 'local'"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router/composables'
import packageDetails from '../../../package.json'
import { useI18n } from '../composables/use-i18n-polyfill'

import FtCard from '../components/ft-card/ft-card.vue'
import FtCommunityPost from '../components/FtCommunityPost/FtCommunityPost.vue'
import FtLoader from '../components/FtLoader/FtLoader.vue'
import CommentSection from '../components/CommentSection/CommentSection.vue'

import store from '../store/index'

import { getInvidiousCommunityPost } from '../helpers/api/invidious'
import { getLocalCommunityPost } from '../helpers/api/local'
import { copyToClipboard, showToast } from '../helpers/utils'

const { t } = useI18n()

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

onMounted(async () => {
  id.value = route.params.id
  authorId.value = route.query.authorId

  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    await loadDataInvidiousAsync()
  } else {
    await loadDataLocalAsync()
  }
})

function updateTitleAndRoute() {
  store.commit('setAppTitle', `${post.value.author} - ${packageDetails.productName}`)
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

async function loadDataLocalAsync() {
  try {
    post.value = await getLocalCommunityPost(id.value, authorId.value)
    authorId.value = post.value.authorId
    updateTitleAndRoute()
  } catch (error) {
    console.error(error)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      await loadDataInvidiousAsync()
    } else {
      isLoading.value = false
    }
  }
}

async function loadDataInvidiousAsync() {
  try {
    post.value = await getInvidiousCommunityPost(id.value, authorId.value)
    authorId.value = post.value.authorId
    updateTitleAndRoute()
  } catch (error) {
    console.error(error)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      await loadDataLocalAsync()
    } else {
      isLoading.value = false
    }
  }
}

watch(() => route.params.id, async () => {
  // react to route changes...
  isLoading.value = true
  id.value = route.params.id
  authorId.value = route.query.authorId
  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    await loadDataInvidiousAsync()
  } else {
    await loadDataLocalAsync()
  }
})
</script>
