<template>
  <div>
    <FtLoader
      v-if="isLoading"
      :fullscreen="true"
    />
    <FtCard
      v-else
      class="card"
    >
      <h2>
        <font-awesome-icon
          :icon="['fas', 'hashtag']"
          aria-hidden="false"
          class="headingIcon"
          fixed-width
        />
        {{ hashtag }}
      </h2>
      <FtElementList
        v-if="videos.length > 0"
        :data="videos"
      />
      <FtFlexBox
        v-else
      >
        <p
          class="message"
        >
          {{ $t("Hashtag.This hashtag does not currently have any videos") }}
        </p>
      </FtFlexBox>

      <FtAutoLoadNextPageWrapper
        v-if="showFetchMoreButton"
        @load-next-page="handleFetchMore"
      >
        <div
          class="getNextPage"
          role="button"
          tabindex="0"
          @click="handleFetchMore"
          @keydown.space.prevent="handleFetchMore"
          @keydown.enter.prevent="handleFetchMore"
        >
          <FontAwesomeIcon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
        </div>
      </FtAutoLoadNextPageWrapper>
    </FtCard>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtLoader from '../../components/FtLoader/FtLoader.vue'
import FtAutoLoadNextPageWrapper from '../../components/FtAutoLoadNextPageWrapper.vue'
import store from '../../store/index'
import { useRoute } from 'vue-router/composables'
import packageDetails from '../../../../package.json'
import { getHashtagLocal, parseLocalListVideo } from '../../helpers/api/local'
import { copyToClipboard, showToast } from '../../helpers/utils'
import { isNullOrEmpty } from '../../helpers/strings'
import { getHashtagInvidious } from '../../helpers/api/invidious'
import { useI18n } from '../../composables/use-i18n-polyfill'
const { t } = useI18n()

const route = useRoute()

const hashtag = ref('')
const hashtagContinuationData = shallowRef(null)
const videos = shallowRef([])
/** @type {import('vue').Ref<'local' | 'invidious'>} */
const apiUsed = ref('local')
const pageNumber = ref(1)
const isLoading = ref(true)

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => {
  return store.getters.getBackendFallback
})

const showFetchMoreButton = computed(() => {
  return !isNullOrEmpty(hashtagContinuationData.value) || apiUsed.value === 'invidious'
})

onMounted(() => {
  getHashtag()
})

watch(() => route.params.hashtag, () => {
  resetData()
  getHashtag()
})

function resetData() {
  isLoading.value = true
  hashtag.value = ''
  hashtagContinuationData.value = null
  videos.value = []
  apiUsed.value = 'local'
  pageNumber.value = 1
}

async function getHashtag() {
  hashtag.value = decodeURIComponent(route.params.hashtag)
  if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'local') {
    await getLocalHashtag()
  } else {
    await getInvidiousHashtag()
  }
  store.commit('setAppTitle', `#${hashtag.value} - ${packageDetails.productName}`)
}

/**
 * @param {number} page
 */
async function getInvidiousHashtag(page = 1) {
  try {
    const fetchedVideos = await getHashtagInvidious(hashtag.value, page)
    isLoading.value = false
    apiUsed.value = 'invidious'
    videos.value = videos.value.concat(fetchedVideos)
    pageNumber.value += 1
  } catch (error) {
    console.error(error)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      resetData()
      getLocalHashtag()
    } else {
      isLoading.value = false
    }
  }
}

async function getLocalHashtag() {
  try {
    const hashtagData = await getHashtagLocal(hashtag.value)
    videos.value = hashtagData.videos.map((video) => parseLocalListVideo(video))
    apiUsed.value = 'local'
    hashtagContinuationData.value = hashtagData.has_continuation ? hashtagData : null
    isLoading.value = false
  } catch (error) {
    console.error(error)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      resetData()
      getInvidiousHashtag()
    } else {
      isLoading.value = false
    }
  }
}

async function getLocalHashtagMore() {
  try {
    const continuation = await hashtagContinuationData.value.getContinuation()
    const newVideos = continuation.videos.map((video) => parseLocalListVideo(video))
    hashtagContinuationData.value = continuation.has_continuation ? continuation : null
    videos.value = videos.value.concat(newVideos)
  } catch (error) {
    console.error(error)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      resetData()
      getInvidiousHashtag()
    } else {
      isLoading.value = false
    }
  }
}

function handleFetchMore() {
  if (process.env.SUPPORTS_LOCAL_API && apiUsed.value === 'local') {
    getLocalHashtagMore()
  } else if (apiUsed.value === 'invidious') {
    getInvidiousHashtag(pageNumber.value)
  }
}
</script>
<style scoped src="./Hashtag.css" />
