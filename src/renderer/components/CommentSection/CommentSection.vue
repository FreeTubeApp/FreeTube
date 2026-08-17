<template>
  <FtCard
    class="card"
  >
    <h3
      v-if="commentData.length > 0 && !isLoading && showComments"
      class="commentsTitle"
    >
      {{ $t("Comments.Comments") }}
      <span
        class="hideComments"
        role="button"
        tabindex="0"
        @click="showComments = false"
        @keydown.enter.space.prevent="showComments = false"
      >
        {{ $t("Comments.Hide Comments") }}
      </span>
    </h3>
    <h4
      v-if="canPerformInitialCommentLoading"
      class="getCommentsTitle"
      role="button"
      tabindex="0"
      @click="getCommentData"
      @keydown.enter.space.prevent="getCommentData"
    >
      {{ $t("Comments.Click to View Comments") }}
    </h4>
    <h4
      v-if="commentData.length > 0 && !isLoading && !showComments"
      class="getCommentsTitle"
      role="button"
      tabindex="0"
      @click="showComments = true"
      @keydown.enter.space.prevent="showComments = true"
    >
      {{ $t("Comments.Click to View Comments") }}
    </h4>
    <FtSelect
      v-if="commentData.length > 0 && !isLoading && showComments && showSortBy"
      class="commentSort"
      :placeholder="$t('Global.Sort By')"
      :value="currentSortValue"
      :select-names="sortNames"
      :select-values="sortValues"
      :icon="['fas', 'arrow-down-short-wide']"
      @change="handleSortChange"
    />
    <div
      v-if="commentData.length > 0 && showComments"
    >
      <FtComment
        v-for="(comment, index) in commentData"
        :id="'comment' + index"
        :key="comment.id"
        :comment="comment"
        :channel-name="channelName"
        :channel-thumbnail="channelThumbnail"
        :autoload-this-reply-level="false"
        :can-fallback-to-invidious="canFallbackToInvidious"
        :get-invidious-comment-replies="getInvidiousCommentReplies"
        @timestamp-event="onTimestamp"
      />
    </div>
    <div
      v-else-if="showComments && !isLoading"
    >
      <h3
        v-if="isPostComments"
        class="noCommentMsg"
      >
        {{ $t("Comments.There are no comments available for this post") }}
      </h3>
      <h3
        v-else
        class="noCommentMsg"
      >
        {{ $t("Comments.There are no comments available for this video") }}
      </h3>
    </div>
    <h4
      v-if="canPerformMoreCommentLoading"
      class="getMoreComments"
      role="button"
      tabindex="0"
      @click="getMoreComments"
      @keydown.enter.space.prevent="getMoreComments"
    >
      {{ $t("Comments.Load More Comments") }}
    </h4>
    <FtLoader
      v-if="isLoading"
    />
    <div
      v-observe-visibility="observeVisibilityOptions"
    >
      <!--
        Dummy element to be observed by Intersection Observer
      -->
    </div>
  </FtCard>
</template>

<script setup>
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import FtCard from '../ft-card/ft-card.vue'
import FtComment from '../FtComment/FtComment.vue'
import FtLoader from '../FtLoader/FtLoader.vue'
import FtSelect from '../FtSelect/FtSelect.vue'

import store from '../../store/index'

import { copyToClipboard, showToast } from '../../helpers/utils'
import { getLocalCommunityPostComments, getLocalComments, parseLocalComment } from '../../helpers/api/local'
import {
  getInvidiousCommunityPostCommentReplies,
  getInvidiousCommunityPostComments,
  invidiousGetCommentReplies,
  invidiousGetComments
} from '../../helpers/api/invidious'

const { t } = useI18n()

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelThumbnail: {
    type: String,
    required: true
  },
  videoPlayerReady: {
    type: Boolean,
    required: true
  },
  isPostComments: {
    type: Boolean,
    default: false,
  },
  postAuthorId: {
    type: String,
    default: null
  },
  showSortBy: {
    type: Boolean,
    default: true,
  }
})

const emit = defineEmits(['timestamp-event'])
/**
 * @param {number} timestamp
 */
function onTimestamp(timestamp) {
  emit('timestamp-event', timestamp)
}

const isLoading = ref(false)
const isMoreCommentsLoading = ref(false)
const showComments = ref(false)
const nextPageToken = shallowRef(null)

/** @type {import('vue').ShallowRef<import('../FtComment/FtComment.vue').Comment[]>} */
const commentData = shallowRef([])

/** @type {import('youtubei.js').YT.Comments | undefined} */
let localCommentsInstance

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => {
  return store.getters.getBackendFallback
})

/** @type {import('vue').ComputedRef<boolean>} */
const canFallbackToInvidious = computed(() => {
  return backendFallback.value && backendPreference.value === 'local'
})

/** @type {import('vue').ComputedRef<boolean>} */
const generalAutoLoadMorePaginatedItemsEnabled = computed(() => {
  return store.getters.getGeneralAutoLoadMorePaginatedItemsEnabled
})

const canPerformInitialCommentLoading = computed(() => {
  return commentData.value.length === 0 && !isLoading.value && !showComments.value
})

const canPerformMoreCommentLoading = computed(() => {
  return commentData.value.length > 0 && !isLoading.value && showComments.value && !!nextPageToken.value && !isMoreCommentsLoading.value
})

const observeVisibilityOptions = computed(() => {
  if (!generalAutoLoadMorePaginatedItemsEnabled.value) {
    return false
  }
  if (!props.videoPlayerReady && !props.isPostComments) { return false }

  return {
    /**
     * @param {boolean} isVisible
     */
    callback: (isVisible) => {
      // This is also fired when **hidden**
      // No point doing anything if not visible
      if (!isVisible) { return }
      // It's possible the comments are being loaded/already loaded
      if (canPerformInitialCommentLoading.value) {
        getCommentData()
      } else if (canPerformMoreCommentLoading.value) {
        getMoreComments()
      }
    },
    intersection: {
      // Only when it intersects with N% above bottom
      rootMargin: '0% 0% 0% 0%',
    },
    // Callback responsible for loading multiple comment pages
    once: false,
  }
})

const sortNames = computed(() => [
  t('Comments.Top comments'),
  t('Comments.Newest first')
])

const sortValues = [
  'top',
  'newest'
]

const sortNewest = ref(false)

const currentSortValue = computed(() => sortNewest.value ? 'newest' : 'top')

function handleSortChange() {
  sortNewest.value = !sortNewest.value
  commentData.value = []
  nextPageToken.value = null
  getCommentData()
}

function getCommentData() {
  isLoading.value = true

  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    if (!props.isPostComments) {
      getCommentDataInvidious()
    } else {
      getPostCommentsInvidious()
    }
  } else {
    getCommentDataLocal()
  }
}

async function getMoreComments() {
  if (commentData.value.length === 0 || nextPageToken.value == null) {
    showToast(t('Comments.There are no more comments for this video'))
  } else {
    if (isMoreCommentsLoading.value) return

    isMoreCommentsLoading.value = true

    if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
      if (!props.isPostComments) {
        await getCommentDataInvidious()
      } else {
        await getPostCommentsInvidious()
      }
    } else {
      await getCommentDataLocal(true)
    }

    isMoreCommentsLoading.value = false
  }
}

/**
 * @param {boolean | undefined} more
 */
async function getCommentDataLocal(more = false) {
  try {
    /** @type {import('youtubei.js').YT.Comments} */
    let comments
    if (more) {
      comments = await nextPageToken.value.getContinuation()
    } else if (localCommentsInstance) {
      comments = await localCommentsInstance.applySort(sortNewest.value ? 'NEWEST_FIRST' : 'TOP_COMMENTS')
      localCommentsInstance = comments
    } else {
      if (props.isPostComments) {
        comments = await getLocalCommunityPostComments(props.id, props.postAuthorId)
        sortNewest.value = comments.header?.sort_menu?.sub_menu_items?.[1].selected ?? false
        localCommentsInstance = comments
      } else {
        comments = await getLocalComments(props.id)
        sortNewest.value = comments.header?.sort_menu?.sub_menu_items?.[1].selected ?? false
        localCommentsInstance = comments
      }
    }

    const parsedComments = comments.contents
      .map(commentThread => parseLocalComment(commentThread.comment, commentThread))

    if (more) {
      commentData.value = commentData.value.concat(parsedComments)
    } else {
      commentData.value = parsedComments
    }

    nextPageToken.value = comments.has_continuation ? comments : null
    isLoading.value = false
    showComments.value = true
  } catch (err) {
    // region No comment detection
    // No comment related info when video info requested earlier in parent component
    if (err.message.includes('The comments page did not have any content')) {
      // For videos without any comment (comment disabled?)
      // e.g. https://youtu.be/8NBSwDEf8a8
      commentData.value = []
      nextPageToken.value = null
      isLoading.value = false
      showComments.value = true
      localCommentsInstance = undefined
      return
    }
    // endregion No comment detection

    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendFallback.value && backendPreference.value === 'local') {
      localCommentsInstance = undefined
      showToast(t('Falling back to Invidious API'))
      if (props.isPostComments) {
        await getPostCommentsInvidious()
      } else {
        await getCommentDataInvidious()
      }
    } else {
      isLoading.value = false
    }
  }
}

async function getCommentDataInvidious() {
  try {
    const { response, commentData: comments } = await invidiousGetComments({
      id: props.id,
      nextPageToken: nextPageToken.value,
      sortNewest: sortNewest.value
    })

    commentData.value = commentData.value.concat(comments)
    nextPageToken.value = response.continuation
    isLoading.value = false
    showComments.value = true
  } catch (err) {
    // region No comment detection
    // No comment related info when video info requested earlier in parent component
    if (err.message.includes('Comments not found')) {
      // For videos without any comment (comment disabled?)
      // e.g. https://youtu.be/8NBSwDEf8a8
      commentData.value = []
      nextPageToken.value = null
      isLoading.value = false
      showComments.value = true
      return
    }
    // endregion No comment detection

    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendFallback.value && backendPreference.value === 'invidious') {
      showToast(t('Falling back to Local API'))
      await getCommentDataLocal()
    } else {
      isLoading.value = false
    }
  }
}

async function getPostCommentsInvidious() {
  try {
    const fetchComments = nextPageToken.value == null
      ? getInvidiousCommunityPostComments({ postId: props.id, authorId: props.postAuthorId })
      : getInvidiousCommunityPostCommentReplies({ postId: props.id, replyToken: nextPageToken.value, authorId: props.postAuthorId })

    const { response, commentData: comments, continuation } = await fetchComments

    commentData.value = commentData.value.concat(comments)
    nextPageToken.value = response?.continuation ?? continuation
    isLoading.value = false
    showComments.value = true
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendFallback.value && backendPreference.value === 'invidious') {
      showToast(t('Falling back to Local API'))
      await getCommentDataLocal()
    } else {
      isLoading.value = false
    }
  }
}

/**
 * Pure function for use inside FtComment
 * @param {string} replyToken
 */
async function getInvidiousCommentReplies(replyToken) {
  try {
    return !props.isPostComments
      ? await invidiousGetCommentReplies({ id: props.id, replyToken })
      : await getInvidiousCommunityPostCommentReplies({ postId: props.id, replyToken, authorId: props.postAuthorId })
  } catch (error) {
    console.error(error)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    return null
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped src="./CommentSection.css" />
