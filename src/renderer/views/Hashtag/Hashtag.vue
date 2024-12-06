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
      <h2>{{ hashtag }}</h2>
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
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtAutoLoadNextPageWrapper from '../../components/ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import store from '../../store/index'
import { useRoute } from 'vue-router/composables'
import packageDetails from '../../../../package.json'
import { getHashtagLocal, parseLocalListVideo } from '../../helpers/api/local'
import { copyToClipboard, setPublishedTimestampsInvidious, showToast } from '../../helpers/utils'
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
  const hashtagInRoute = decodeURIComponent(route.params.hashtag)
  if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'local') {
    await getLocalHashtag(hashtagInRoute)
  } else {
    await getInvidiousHashtag(hashtagInRoute)
  }
  store.dispatch('setAppTitle', `${hashtag.value} - ${packageDetails.productName}`)
}

/**
 * @param {string} hashtagInRoute
 * @param {number} page
 */
async function getInvidiousHashtag(hashtagInRoute, page) {
  try {
    const fetchedVideos = await getHashtagInvidious(hashtagInRoute, page)
    setPublishedTimestampsInvidious(fetchedVideos)
    hashtag.value = '#' + hashtagInRoute
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
      getLocalHashtag(hashtag)
    } else {
      isLoading.value = false
    }
  }
}

/**
 * @param {string} hashtagInRoute
 */
async function getLocalHashtag(hashtagInRoute) {
  try {
    const hashtagData = await getHashtagLocal(hashtagInRoute)

    const header = hashtagData.header
    if (header) {
      switch (header.type) {
        case 'HashtagHeader':
          hashtag.value = header.hashtag.toString()
          break
        case 'PageHeader':
          hashtag.value = header.content.title.text
          break
        default:
          console.error(`Unknown hashtag header type: ${header.type}, falling back to query parameter.`)
          hashtag.value = `#${hashtagInRoute}`
      }
    } else {
      console.error(' Hashtag header missing, probably a layout change, falling back to query parameter.')
      hashtag.value = `#${hashtagInRoute}`
    }

    videos.value = hashtagData.videos.map(parseLocalListVideo)
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
      getInvidiousHashtag(hashtag)
    } else {
      isLoading.value = false
    }
  }
}

async function getLocalHashtagMore() {
  try {
    const continuation = await hashtagContinuationData.value.getContinuation()
    const newVideos = continuation.videos.map(parseLocalListVideo)
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
      const hashtagWithoutSymbol = hashtag.value.substring(1)
      resetData()
      getInvidiousHashtag(hashtagWithoutSymbol)
    } else {
      isLoading.value = false
    }
  }
}

function handleFetchMore() {
  if (process.env.SUPPORTS_LOCAL_API && apiUsed.value === 'local') {
    getLocalHashtagMore()
  } else if (apiUsed.value === 'invidious') {
    getInvidiousHashtag(hashtag.value.substring(1), pageNumber.value)
  }
}
</script>
<style scoped src="./Hashtag.css" />
