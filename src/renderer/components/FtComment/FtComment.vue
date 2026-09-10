<template>
  <div
    :id="id"
    class="comment"
  >
    <component
      :is="enableChannelLinks ? 'router-link' : 'div'"
      :to="`/channel/${comment.authorId}`"
      tabindex="-1"
    >
      <!-- Hide comment photo only if it isn't the video uploader -->
      <div
        v-if="hideCommentPhotos && !comment.isOwner"
        class="commentThumbnailHidden"
        dir="auto"
      >
        {{ comment.author.substring(1, 2) }}
      </div>
      <img
        v-else
        :src="comment.authorThumb"
        alt=""
        class="commentThumbnail"
      >
    </component>
    <p
      v-if="comment.isPinned"
      class="commentPinned"
    >
      <FontAwesomeIcon
        :icon="['fas', 'thumbtack']"
      />
      {{ $t("Comments.Pinned by") }} <bdi>{{ channelName }}</bdi>
    </p>
    <p
      class="commentAuthorWrapper"
    >
      <component
        :is="enableChannelLinks ? 'router-link' : 'span'"
        class="commentAuthor"
        dir="auto"
        :class="{
          commentOwner: comment.isOwner
        }"
        :to="`/channel/${comment.authorId}`"
      >
        {{ comment.author }}
      </component>
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
        {{ comment.likes || '' }}
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
        v-if="showReplies || comment.numReplies > 0 && !repliesLoading"
        class="commentMoreReplies"
        role="button"
        tabindex="0"
        @click="toggleCommentReplies"
        @keydown.enter.space.prevent="toggleCommentReplies"
      >
        <span>
          {{ toggleCommentRepliesText }}
        </span>
      </span>
      <span
        v-else-if="comment.numReplies > 0 && repliesLoading"
        class="commentLoadingMoreReplies"
        tabindex="0"
      >
        <span>
          {{ $t("Comments.Loading replies") }}
        </span>
      </span>
    </p>
    <div
      v-if="showReplies"
      class="commentReplies"
    >
      <FtComment
        v-for="(reply, replyIndex) in replies"
        :id="id + '-' + replyIndex"
        :key="replyIndex"
        :comment="reply"
        :channel-name="channelName"
        :channel-thumbnail="channelThumbnail"
        :autoload-this-reply-level="!!reply.replyLevel && !autoloadThisReplyLevel"
        :can-fallback-to-invidious="canFallbackToInvidious"
        :get-invidious-comment-replies="getInvidiousCommentReplies"
        @timestamp-event="onTimestamp"
      />
      <div
        v-if="replyToken && !repliesLoading"
        class="showMoreReplies"
        role="button"
        tabindex="0"
        @click="getCommentReplies"
        @keydown.enter.space.prevent="getCommentReplies"
      >
        <span>{{ t('Comments.Show More Replies') }}{{ numRepliesRemainingText }}</span>
      </div>
      <div
        v-else-if="replyToken && repliesLoading"
        class="loadingMoreReplies"
        tabindex="0"
      >
        <span>{{ $t("Comments.Loading replies") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import FtTimestampCatcher from '../FtTimestampCatcher.vue'

import store from '../../store/index'

import { copyToClipboard, showToast } from '../../helpers/utils'
import { parseLocalComment } from '../../helpers/api/local'

const { t } = useI18n()

/**
 * @import { ComputedRef, PropType, ShallowRef } from 'vue'
 *
 * @import { InvidiousComment } from '../../helpers/api/invidious')
 * @import { LocalComment } from '../../helpers/api/local'
 *
 * @typedef {InvidiousComment | LocalComment} Comment
 * @exports Comment
 */
const props = defineProps({
  id: {
    type: String,
    required: true
  },
  comment: {
    /** @type {PropType<Comment>} */
    type: Object,
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
  autoloadThisReplyLevel: {
    type: Boolean,
    default: false
  },
  getInvidiousCommentReplies: {
    /** @type {PropType<(replyToken: string) => Promise<{commentData: InvidiousComment[], continuation?: string} | null>>} */
    type: Function,
    required: true
  },
  canFallbackToInvidious: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['timestamp-event'])
/**
 * @param {number} timestamp
 */
function onTimestamp(timestamp) {
  emit('timestamp-event', timestamp)
}

const showReplies = ref(false)
const repliesLoading = ref(false)
const replyToken = shallowRef(props.comment.replyToken)
/** @type {ShallowRef<Comment[]>} */
const replies = shallowRef([])

/** @type {ComputedRef<boolean>} */
const hideCommentLikes = computed(() => {
  return store.getters.getHideCommentLikes
})

/** @type {ComputedRef<boolean>} */
const hideCommentPhotos = computed(() => {
  return store.getters.getHideCommentPhotos
})

const enableChannelLinks = computed(() => !store.getters.getDisableChannelLinks)

/** @type {ComputedRef<Set<string>>} */
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

const numRepliesRemainingText = computed(() => {
  if (props.comment.numReplies >= 1000) return ''
  const numLoadedReplies = replies.value.reduce((sum, reply) => sum + 1 + reply.numReplies, 0)
  const count = props.comment.numReplies - numLoadedReplies
  return t('Global.Counts.Replies Remaining', { count }, count)
})

const toggleCommentRepliesText = computed(() => {
  const channelName = props.channelName
  const replyCount = props.comment.numReplies

  if (showReplies.value) {
    return t('Comments.Hide Replies', replyCount)
  }

  if (props.comment.hasOwnerReplied) {
    if (replyCount > 1) {
      return t('Comments.View {replyCount} replies from {channelName} and others', { replyCount, channelName })
    }

    return t('Comments.View 1 reply from {channelName}', { channelName })
  }

  return t('Comments.View {replyCount} replies', { replyCount: `${replyCount >= 1000 ? '~' : ''}${replyCount}` }, replyCount)
})

onMounted(() => {
  if (!props.autoloadThisReplyLevel || !props.comment.numReplies) return
  toggleCommentReplies()
})

function toggleCommentReplies() {
  if (showReplies.value || replies.value.length > 0) {
    showReplies.value = !showReplies.value
  } else {
    getCommentReplies()
  }
}

async function getCommentReplies() {
  if (repliesLoading.value) return

  repliesLoading.value = true

  if (!process.env.SUPPORTS_LOCAL_API || props.comment.dataType === 'invidious') {
    await getCommentRepliesInvidious()
  } else {
    await getCommentRepliesLocal()
  }

  repliesLoading.value = false
}

async function getCommentRepliesLocal() {
  try {
    let commentThread = /** @type {LocalComment['replyToken']} */ (replyToken.value)
    if (commentThread == null) return

    /**
     * @typedef {Awaited<ReturnType<
     *   NonNullable<typeof commentThread>['getContinuation']
     * >>} CommentsContinuation
     */
    /**
     * @param {NonNullable<typeof commentThread>} _
     * @return {_ is CommentsContinuation}
     */
    function isContinuation(_) {
      return replies.value.length > 0
    }

    /** @param {CommentsContinuation['replies']} subThreads */
    function processReplies(subThreads) {
      return subThreads.reduce((replies, subThread) => {
        return subThread.comment ? replies.concat(parseLocalComment(subThread.comment, subThread)) : replies
      }, /** @type {LocalComment[]} */ ([]))
    }

    if (isContinuation(commentThread)) {
      commentThread = await commentThread.getContinuation()
      replies.value = replies.value.concat(processReplies(commentThread.replies))
    } else {
      if (!commentThread.is_prepopulated) {
        await commentThread.getReplies()
      }
      replies.value = commentThread.replies ? processReplies(commentThread.replies) : []
    }

    if (commentThread.has_continuation) {
      replyToken.value = commentThread
    } else {
      replyToken.value = null
    }

    showReplies.value = true
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (props.canFallbackToInvidious) {
      showToast(t('Falling back to Invidious API'))
      await getCommentRepliesInvidious()
    }
  }
}

async function getCommentRepliesInvidious() {
  const fetchReplies = await props.getInvidiousCommentReplies(replyToken.value)
  if (!fetchReplies) return

  const { commentData, continuation } = fetchReplies
  replies.value = replies.value.concat(commentData)
  showReplies.value = true
  replyToken.value = continuation ?? ''
}

</script>

<style scoped src="./FtComment.css" />
