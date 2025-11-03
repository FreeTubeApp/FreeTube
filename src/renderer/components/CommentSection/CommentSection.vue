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
        @keydown.space.prevent="showComments = false"
        @keydown.enter.prevent="showComments = false"
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
      @keydown.space.prevent="getCommentData"
      @keydown.enter.prevent="getCommentData"
    >
      {{ $t("Comments.Click to View Comments") }}
    </h4>
    <h4
      v-if="commentData.length > 0 && !isLoading && !showComments"
      class="getCommentsTitle"
      role="button"
      tabindex="0"
      @click="showComments = true"
      @keydown.space.prevent="showComments = true"
      @keydown.enter.prevent="showComments = true"
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
      <div
        v-for="(comment, index) in commentData"
        :id="'comment' + index"
        :key="comment.id"
        class="comment"
      >
        <router-link
          :to="`/channel/${comment.authorLink}`"
          tabindex="-1"
        >
          <!-- Hide comment photo only if it isn't the video uploader -->
          <div
            v-if="hideCommentPhotos && !comment.isOwner"
            class="commentThumbnailHidden"
          >
            {{ comment.author.substring(1, 2) }}
          </div>
          <img
            v-else
            :src="comment.authorThumb"
            alt=""
            class="commentThumbnail"
          >
        </router-link>
        <p
          v-if="comment.isPinned"
          class="commentPinned"
        >
          <FontAwesomeIcon
            :icon="['fas', 'thumbtack']"
          />
          {{ $t("Comments.Pinned by") }} {{ channelName }}
        </p>
        <p
          class="commentAuthorWrapper"
        >
          <router-link
            class="commentAuthor"
            :class="{
              commentOwner: comment.isOwner
            }"
            :to="`/channel/${comment.authorLink}`"
          >
            {{ comment.author }}
          </router-link>
          <img
            v-if="comment.isMember"
            :src="comment.memberIconUrl"
            :title="$t('Comments.Member')"
            :aria-label="$t('Comments.Member')"
            class="commentMemberIcon"
            alt=""
          >
          <img
            v-if="isSubscribedToChannel(comment.authorId)"
            :title="$t('Comments.Subscribed')"
            :aria-label="$t('Comments.Subscribed')"
            class="commentSubscribedIcon"
            alt=""
          >
          <span class="commentDate">
            {{ comment.time }}
          </span>
        </p>
        <FtTimestampCatcher
          class="commentText"
          :input-html="comment.text"
          @timestamp-event="onTimestamp"
        />
        <p class="commentLikeCount">
          <template
            v-if="!hideCommentLikes"
          >
            <FontAwesomeIcon
              :icon="['fas', 'thumbs-up']"
            />
            {{ comment.likes }}
          </template>
          <span
            v-if="comment.isHearted"
            class="commentHeartBadge"
          >
            <img
              :src="channelThumbnail"
              :title="$t('Comments.Hearted')"
              :aria-label="$t('Comments.Hearted')"
              class="commentHeartBadgeImg"
              alt=""
            >
            <FontAwesomeIcon
              :icon="['fas', 'heart']"
              class="commentHeartBadgeWhite"
            />
            <FontAwesomeIcon
              :icon="['fas', 'heart']"
              class="commentHeartBadgeRed"
            />
          </span>
          <span
            v-if="comment.numReplies > 0"
            class="commentMoreReplies"
            role="button"
            tabindex="0"
            @click="toggleCommentReplies(index)"
            @keydown.space.prevent="toggleCommentReplies(index)"
            @keydown.enter.prevent="toggleCommentReplies(index)"
          >
            <span v-if="!comment.showReplies">{{ $t("Comments.View") }}</span>
            <span v-else>{{ $t("Comments.Hide") }}</span>
            {{ comment.numReplies }}
            <span v-if="comment.numReplies === 1">{{ $t("Comments.Reply").toLowerCase() }}</span>
            <span v-else>{{ $t("Comments.Replies").toLowerCase() }}</span>
            <span v-if="comment.hasOwnerReplied && !comment.showReplies"> {{ $t("Comments.From {channelName}", { channelName }) }}</span>
            <span v-if="comment.numReplies > 1 && comment.hasOwnerReplied && !comment.showReplies"> {{ $t("Comments.And others") }}</span>
          </span>
        </p>
        <div
          v-if="comment.showReplies"
          class="commentReplies"
        >
          <div
            v-for="(reply, replyIndex) in comment.replies"
            :id="'comment' + index + '-' + replyIndex"
            :key="replyIndex"
            class="comment"
          >
            <router-link
              :to="`/channel/${reply.authorLink}`"
              tabindex="-1"
            >
              <!-- Hide comment photo only if it isn't the video uploader -->
              <div
                v-if="hideCommentPhotos && !reply.isOwner"
                class="commentThumbnailHidden"
              >
                {{ reply.author.substring(1, 2) }}
              </div>
              <img
                v-else
                :src="reply.authorThumb"
                alt=""
                class="commentThumbnail"
              >
            </router-link>
            <p class="commentAuthorWrapper">
              <router-link
                class="commentAuthor"
                :class="{
                  commentOwner: reply.isOwner
                }"
                :to="`/channel/${reply.authorLink}`"
              >
                {{ reply.author }}
              </router-link>
              <img
                v-if="reply.isMember"
                :src="reply.memberIconUrl"
                class="commentMemberIcon"
                alt=""
              >
              <img
                v-if="isSubscribedToChannel(reply.authorId)"
                :title="$t('Comments.Subscribed')"
                :aria-label="$t('Comments.Subscribed')"
                class="commentSubscribedIcon"
                alt=""
              >
              <span class="commentDate">
                {{ reply.time }}
              </span>
            </p>
            <FtTimestampCatcher
              class="commentText"
              :input-html="reply.text"
              @timestamp-event="onTimestamp"
            />
            <p class="commentLikeCount">
              <template
                v-if="!hideCommentLikes"
              >
                <FontAwesomeIcon
                  v-if="!hideCommentLikes"
                  :icon="['fas', 'thumbs-up']"
                />
                {{ reply.likes }}
              </template>
              <span
                v-if="reply.isHearted"
                class="commentHeartBadge"
              >
                <img
                  :src="channelThumbnail"
                  :title="$t('Comments.Hearted')"
                  :aria-label="$t('Comments.Hearted')"
                  class="commentHeartBadgeImg"
                  alt=""
                >
                <FontAwesomeIcon
                  :icon="['fas', 'heart']"
                  class="commentHeartBadgeWhite"
                />
                <FontAwesomeIcon
                  :icon="['fas', 'heart']"
                  class="commentHeartBadgeRed"
                />
              </span>
            </p>
            <p
              v-if="reply.numReplies > 0"
              class="commentMoreReplies"
            >
              {{ $t('Comments.View {replyCount} replies', { replyCount: reply.numReplies }) }}
            </p>
          </div>
          <div
            v-if="comment.hasReplyToken"
            class="showMoreReplies"
            role="button"
            tabindex="0"
            @click="getCommentReplies(index)"
            @keydown.space.prevent="getCommentReplies(index)"
            @keydown.enter.prevent="getCommentReplies(index)"
          >
            <span>{{ $t("Comments.Show More Replies") }}</span>
          </div>
        </div>
      </div>
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
      @keydown.space.prevent="getMoreComments"
      @keydown.enter.prevent="getMoreComments"
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtCard from '../ft-card/ft-card.vue'
import FtLoader from '../FtLoader/FtLoader.vue'
import FtSelect from '../FtSelect/FtSelect.vue'
import FtTimestampCatcher from '../FtTimestampCatcher.vue'

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

const isLoading = ref(false)
const showComments = ref(false)
const nextPageToken = shallowRef(null)

// Has to be ref not shallowRef, as the replies are stored in a property on the comments
// we need to react to new replies and showReplies being toggled
const commentData = ref([])

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
const hideCommentLikes = computed(() => {
  return store.getters.getHideCommentLikes
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideCommentPhotos = computed(() => {
  return store.getters.getHideCommentPhotos
})

/** @type {import('vue').ComputedRef<boolean>} */
const generalAutoLoadMorePaginatedItemsEnabled = computed(() => {
  return store.getters.getGeneralAutoLoadMorePaginatedItemsEnabled
})

const canPerformInitialCommentLoading = computed(() => {
  return commentData.value.length === 0 && !isLoading.value && !showComments.value
})

const canPerformMoreCommentLoading = computed(() => {
  return commentData.value.length > 0 && !isLoading.value && showComments.value && !!nextPageToken.value
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

const emit = defineEmits(['timestamp-event'])

/**
 * @param {number} timestamp
 */
function onTimestamp(timestamp) {
  emit('timestamp-event', timestamp)
}

/** @type {import('vue').ComputedRef<Set<string>>} */
const subscribedChannelIds = computed(() => {
  return store.getters.getActiveProfile.subscriptions.reduce((set, channel) => {
    return set.add(channel.id)
  }, new Set())
})

/**
 * @param {string} channelId
 */
function isSubscribedToChannel(channelId) {
  return subscribedChannelIds.value.has(channelId)
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

function getMoreComments() {
  if (commentData.value.length === 0 || nextPageToken.value == null) {
    showToast(t('Comments.There are no more comments for this video'))
  } else {
    if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
      if (!props.isPostComments) {
        getCommentDataInvidious()
      } else {
        getPostCommentsInvidious()
      }
    } else {
      getCommentDataLocal(true)
    }
  }
}

/**
 * @param {number} index
 */
function toggleCommentReplies(index) {
  if (commentData.value[index].showReplies || commentData.value[index].replies.length > 0) {
    commentData.value[index].showReplies = !commentData.value[index].showReplies
  } else {
    getCommentReplies(index)
  }
}

/**
 * @param {number} index
 */
function getCommentReplies(index) {
  if (!process.env.SUPPORTS_LOCAL_API || commentData.value[index].dataType === 'invidious') {
    if (!props.isPostComments) {
      getCommentRepliesInvidious(index)
    } else {
      getPostCommentRepliesInvidious(index)
    }
  } else {
    getCommentRepliesLocal(index)
  }
}

/** @type {Map<string, (import('youtubei.js').YTNodes.CommentThread | string)>} */
const replyTokens = new Map()

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
      .map(commentThread => {
        // Use destructuring to create a new object without the replyToken
        const { replyToken, ...comment } = parseLocalComment(commentThread.comment, commentThread)

        if (comment.hasReplyToken) {
          replyTokens.set(comment.id, replyToken)
        } else {
          replyTokens.delete(comment.id)
        }

        return comment
      })

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
    if (err.message.includes('Comments page did not have any content')) {
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
        getPostCommentsInvidious()
      } else {
        getCommentDataInvidious()
      }
    } else {
      isLoading.value = false
    }
  }
}

/**
 * @param {number} index
 */
async function getCommentRepliesLocal(index) {
  showToast(t('Comments.Getting comment replies, please wait'))

  try {
    const comment = commentData.value[index]
    /** @type {import('youtubei.js').YTNodes.CommentThread} */
    const commentThread = replyTokens.get(comment.id)

    if (commentThread == null) {
      replyTokens.delete(comment.id)
      comment.hasReplyToken = false
      return
    }

    if (comment.replies.length > 0) {
      await commentThread.getContinuation()
      comment.replies = comment.replies.concat(commentThread.replies.map(reply => parseLocalComment(reply)))
    } else {
      await commentThread.getReplies()
      comment.replies = commentThread.replies.map(reply => parseLocalComment(reply))
    }

    if (commentThread.has_continuation) {
      replyTokens.set(comment.id, commentThread)
      comment.hasReplyToken = true
    } else {
      replyTokens.delete(comment.id)
      comment.hasReplyToken = false
    }

    comment.showReplies = true
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendFallback.value && backendPreference.value === 'local') {
      showToast(t('Falling back to Invidious API'))
      getCommentDataInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getCommentDataInvidious() {
  try {
    let { response, commentData: comments } = await invidiousGetComments({
      id: props.id,
      nextPageToken: nextPageToken.value,
      sortNewest: sortNewest.value
    })

    comments = comments.map(({ replyToken, ...comment }) => {
      if (comment.hasReplyToken) {
        replyTokens.set(comment.id, replyToken)
      } else {
        replyTokens.delete(comment.id)
      }

      return comment
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
      getCommentDataLocal()
    } else {
      isLoading.value = false
    }
  }
}

/**
 * @param {number} index
 */
async function getCommentRepliesInvidious(index) {
  showToast(t('Comments.Getting comment replies, please wait'))

  const comment = commentData.value[index]
  const replyToken = replyTokens.get(comment.id)

  try {
    const { commentData, continuation } = await invidiousGetCommentReplies({ id: props.id, replyToken })

    comment.replies = comment.replies.concat(commentData)
    comment.showReplies = true

    if (continuation) {
      replyTokens.set(comment.id, continuation)
      comment.hasReplyToken = true
    } else {
      replyTokens.delete(comment.id)
      comment.hasReplyToken = false
    }

    isLoading.value = false
  } catch (error) {
    console.error(error)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    isLoading.value = false
  }
}

function getPostCommentsInvidious() {
  const fetchComments = nextPageToken.value == null
    ? getInvidiousCommunityPostComments({ postId: props.id, authorId: props.postAuthorId })
    : getInvidiousCommunityPostCommentReplies({ postId: props.id, replyToken: nextPageToken.value, authorId: props.postAuthorId })

  fetchComments.then(({ response, commentData: comments, continuation }) => {
    comments = comments.map(({ replyToken, ...comment }) => {
      if (comment.hasReplyToken) {
        replyTokens.set(comment.id, replyToken)
      } else {
        replyTokens.delete(comment.id)
      }

      return comment
    })

    commentData.value = commentData.value.concat(comments)
    nextPageToken.value = response?.continuation ?? continuation
    isLoading.value = false
    showComments.value = true
  }).catch((err) => {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendFallback.value && backendPreference.value === 'invidious') {
      showToast(t('Falling back to Local API'))
      getCommentDataLocal()
    } else {
      isLoading.value = false
    }
  })
}

async function getPostCommentRepliesInvidious(index) {
  showToast(t('Comments.Getting comment replies, please wait'))

  const comment = commentData.value[index]
  const replyToken = replyTokens.get(comment.id)

  try {
    const { commentData: comments, continuation } = await getInvidiousCommunityPostCommentReplies({
      postId: props.id,
      replyToken: replyToken,
      authorId: props.postAuthorId
    })
    comment.replies = comment.replies.concat(comments)
    comment.showReplies = true

    if (continuation) {
      replyTokens.set(comment.id, continuation)
      comment.hasReplyToken = true
    } else {
      replyTokens.delete(comment.id)
      comment.hasReplyToken = false
    }

    isLoading.value = false
  } catch (error) {
    console.error(error)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    isLoading.value = false
  }
}
</script>

<style scoped src="./CommentSection.css" />
