<template>
  <FtCard
    class="card relative"
    :class="{ hasError }"
  >
    <FtLoader
      v-if="isLoading"
    />
    <div
      v-else-if="hasError"
      class="messageContainer"
      :class="{ hasError }"
    >
      <p
        class="message"
      >
        {{ errorMessage }}
      </p>
      <FontAwesomeIcon
        :icon="['fas', 'exclamation-circle']"
        class="errorIcon"
      />
      <FtButton
        v-if="showEnableChat"
        :label="t('Video.Enable Live Chat')"
        class="enableLiveChat"
        @click="enableLiveChat"
      />
    </div>
    <div
      v-else-if="comments.length === 0"
      ref="liveChatMessage"
      class="messageContainer liveChatMessage"
    >
      <p
        class="message"
      >
        {{ t("Video['Live chat is enabled. Chat messages will appear here once sent.']") }}
      </p>
    </div>
    <div
      v-else
      class="relative"
    >
      <h4>
        {{ t("Video.Live Chat") }}
        <span
          v-if="!hideVideoViews && watchingCount !== null"
          class="watchingCount"
        >
          {{ t('Global.Counts.Watching Count', { count: formattedWatchingCount }, watchingCount) }}
        </span>
      </h4>
      <div
        v-if="superChatComments.length > 0"
        class="superChatComments"
      >
        <div
          v-for="comment in superChatComments"
          :key="comment.id"
          :aria-label="t('Video.Show Super Chat Comment')"
          class="superChat"
          :class="comment.superChat.colorClass"
          role="button"
          tabindex="0"
          @click="showSuperChatComment(comment)"
          @keydown.space.prevent="showSuperChatComment(comment)"
          @keydown.enter.prevent="showSuperChatComment(comment)"
        >
          <img
            :src="comment.author.thumbnailUrl"
            class="channelThumbnail"
            alt=""
          >
          <p
            class="superChatContent"
          >
            <span
              class="donationAmount"
            >
              {{ comment.superChat.amount }}
            </span>
          </p>
        </div>
      </div>
      <div
        v-if="showSuperChat"
        class="openedSuperChat"
        :class="superChat.superChat.colorClass"
        role="button"
        tabindex="0"
        @click="hideSuperChat"
        @keydown.space.prevent="hideSuperChat"
        @keydown.enter.prevent="hideSuperChat"
      >
        <div
          class="superChatMessage"
          @click.stop.prevent
        >
          <div
            class="upperSuperChatMessage"
          >
            <img
              :src="superChat.author.thumbnailUrl"
              class="channelThumbnail"
              alt=""
            >
            <p
              class="channelName"
            >
              {{ superChat.author.name }}
            </p>
            <p
              class="donationAmount"
            >
              {{ superChat.superChat.amount }}
            </p>
          </div>
          <p
            class="chatMessage"
            v-html="superChat.message"
          />
        </div>
      </div>
      <div
        ref="commentsRef"
        class="liveChatComments"
        :style="{ blockSize: chatHeight }"
        @mousewheel.passive="onScroll"
        @scrollend="e => onScroll(e, true)"
      >
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment"
          :class="comment.superChat ? `superChatMessage ${comment.superChat.colorClass}` : ''"
        >
          <template
            v-if="comment.superChat"
          >
            <div
              class="upperSuperChatMessage"
            >
              <img
                :src="comment.author.thumbnailUrl"
                class="channelThumbnail"
                alt=""
              >
              <p
                class="channelName"
              >
                {{ comment.author.name }}
              </p>
              <p
                class="donationAmount"
              >
                {{ comment.superChat.amount }}
              </p>
            </div>
            <p
              v-if="comment.message"
              class="chatMessage"
              v-html="comment.message"
            />
          </template>
          <template
            v-else
          >
            <img
              :src="comment.author.thumbnailUrl"
              class="channelThumbnail"
              alt=""
            >
            <p
              class="chatContent"
            >
              <span
                class="channelName"
                :class="{
                  member: comment.author.isMember,
                  moderator: comment.author.isModerator,
                  owner: comment.author.isOwner
                }"
              >
                {{ comment.author.name }}
              </span>
              <span
                v-if="comment.author.badge"
                class="badge"
              >
                <img
                  :src="comment.author.badge.url"
                  alt=""
                  :title="comment.author.badge.tooltip"
                  class="badgeImage"
                >
              </span>
              <span
                class="chatMessage"
                v-html="comment.message"
              />
            </p>
          </template>
        </div>
      </div>
      <div
        v-if="showScrollToBottom"
        class="scrollToBottom"
        :aria-label="t('Video.Scroll to Bottom')"
        role="button"
        tabindex="0"
        @click="scrollToBottom"
        @keydown.space.prevent="scrollToBottom"
        @keydown.enter.prevent="scrollToBottom"
      >
        <FontAwesomeIcon
          class="icon"
          :icon="['fas', 'arrow-down']"
        />
      </div>
    </div>
  </FtCard>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import autolinker from 'autolinker'
import { computed, nextTick, onBeforeUnmount, ref, shallowReactive } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { YTNodes } from 'youtubei.js'

import FtLoader from '../FtLoader/FtLoader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../FtButton/FtButton.vue'

import store from '../../store/index'

import { formatNumber } from '../../helpers/utils'
import { getRandomColorClass } from '../../helpers/colors'
import { getLocalVideoInfo, parseLocalTextRuns } from '../../helpers/api/local'

const props = defineProps({
  liveChat: {
    type: EventTarget,
    default: null
  },
  videoId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  }
})

const { t } = useI18n()

/** @type {import('youtubei.js').YT.LiveChat|null} */
let liveChatInstance = null
let hasEnded = false
let stayAtBottom = false

const isLoading = ref(true)
const hasError = ref(false)
const showEnableChat = ref(false)
const errorMessage = ref('')
const showSuperChat = ref(false)
const showScrollToBottom = ref(false)
const comments = shallowReactive([])
const superChatComments = shallowReactive([])
const superChat = ref({
  id: '',
  author: {
    name: '',
    thumbnailUrl: ''
  },
  message: '',
  superChat: {
    amount: '',
    colorClass: ''
  }
})

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)
/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

const chatHeight = computed(() => superChatComments.length > 0 ? '390px' : '445px')

const scrollingBehaviour = computed(() => {
  return store.getters.getDisableSmoothScrolling ? 'auto' : 'smooth'
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideVideoViews = computed(() => store.getters.getHideVideoViews)

/** @type {import('vue').Ref<number | null>} */
const watchingCount = ref(null)

const formattedWatchingCount = computed(() => {
  return watchingCount.value !== null ? formatNumber(watchingCount.value) : '0'
})

onBeforeUnmount(() => {
  handleEnd()
})

if (!process.env.SUPPORTS_LOCAL_API) {
  hasError.value = true
  errorMessage.value = t('Video["Live Chat is currently not supported in this build."]')
  isLoading.value = false
} else {
  switch (backendPreference.value) {
    case 'local':
      if (props.liveChat) {
        liveChatInstance = props.liveChat
        startLiveChatLocal()
      } else {
        showLiveChatUnavailable()
      }
      break
    case 'invidious':
      if (backendFallback.value) {
        getLiveChatLocal()
      } else {
        hasError.value = true
        errorMessage.value = t('Video["Live Chat is currently not supported with the Invidious API. A direct connection to YouTube is required."]')
        showEnableChat.value = true
        isLoading.value = false
      }
      break
  }
}

function enableLiveChat() {
  hasError.value = false
  showEnableChat.value = false
  isLoading.value = true
  getLiveChatLocal()
}

async function getLiveChatLocal() {
  const videoInfo = await getLocalVideoInfo(props.videoId)

  if (videoInfo.livechat) {
    liveChatInstance = videoInfo.getLiveChat()

    startLiveChatLocal()
  } else {
    showLiveChatUnavailable()
  }
}

function showLiveChatUnavailable() {
  hasError.value = true
  errorMessage.value = t('Video["Live Chat is unavailable for this stream. It may have been disabled by the uploader."]')
  isLoading.value = false
  showEnableChat.value = false
}

function startLiveChatLocal() {
  liveChatInstance.once('start', handleStart)
  liveChatInstance.on('chat-update', handleChatUpdate)
  liveChatInstance.on('metadata-update', handleMetadataUpdate)
  liveChatInstance.once('error', handleError)
  liveChatInstance.once('end', handleEnd)

  liveChatInstance.start()
}

/** @type {import('vue').Ref<HTMLDivElement | null>} */
const commentsRef = ref(null)

/**
 * @param {import ('youtubei.js/dist/src/parser/continuations').LiveChatContinuation} initialData
 */
function handleStart(initialData) {
  const actions = initialData.actions.filterType(YTNodes.AddChatItemAction)

  for (const { item } of actions) {
    if (item.is(YTNodes.LiveChatTextMessage)) {
      parseLiveChatComment(item)
    } else if (item.is(YTNodes.LiveChatPaidMessage)) {
      parseLiveChatSuperChat(item)
    }
  }

  isLoading.value = false

  nextTick(() => {
    commentsRef.value?.scrollTo({
      top: commentsRef.value.scrollHeight,
      behavior: 'instant'
    })
  })
}

/**
 * @param {import('youtubei.js/dist/src/parser/youtube/LiveChat').ChatAction} action
 */
function handleChatUpdate(action) {
  if (!hasEnded && action.is(YTNodes.AddChatItemAction)) {
    if (action.item.is(YTNodes.LiveChatTextMessage)) {
      parseLiveChatComment(action.item)
    } else if (action.item.is(YTNodes.LiveChatPaidMessage)) {
      parseLiveChatSuperChat(action.item)
    }
  }
}

/**
 * @param {import('youtubei.js/dist/src/parser/youtube/LiveChat').LiveMetadata} metadata
 */
function handleMetadataUpdate(metadata) {
  if (metadata.views && !isNaN(metadata.views.original_view_count)) {
    watchingCount.value = metadata.views.original_view_count
  }
}

function handleEnd() {
  hasEnded = true

  if (liveChatInstance) {
    liveChatInstance.stop()
    liveChatInstance.off('start', handleStart)
    liveChatInstance.off('chat-update', handleChatUpdate)
    liveChatInstance.off('metadata-update', handleMetadataUpdate)
    liveChatInstance.off('error', handleError)
    liveChatInstance.off('end', handleEnd)
    liveChatInstance = null
  }
}

/**
 * @param {Error} error
 */
function handleError(error) {
  handleEnd()

  console.error(error)
  errorMessage.value = `[${error.name}] ${error.message}`
  hasError.value = true
  isLoading.value = false
}

/**
 * @param {import('youtubei.js').YTNodes.LiveChatTextMessage} comment
 */
function parseLiveChatComment(comment) {
  /** @type {import('youtubei.js').YTNodes.LiveChatAuthorBadge | undefined} */
  const badge = comment.author.badges.find(badge => badge.is(YTNodes.LiveChatAuthorBadge) && badge.custom_thumbnail)

  const parsedComment = {
    id: comment.id,
    message: autolinker.link(parseLocalTextRuns(comment.message.runs, 20)),
    author: {
      name: comment.author.name,
      thumbnailUrl: comment.author.thumbnails.at(-1).url,
      isOwner: comment.author.id === props.channelId,
      isModerator: comment.author.is_moderator,
      isMember: !!badge
    }
  }

  if (badge) {
    parsedComment.badge = {
      url: badge.custom_thumbnail.at(-1)?.url,
      tooltip: badge.tooltip ?? ''
    }
  }

  pushComment(parsedComment)
}

/**
 * @param {import('youtubei.js').YTNodes.LiveChatPaidMessage} superChat
 */
function parseLiveChatSuperChat(superChat) {
  const parsedComment = {
    id: superChat.id,
    message: autolinker.link(parseLocalTextRuns(superChat.message.runs, 20)),
    author: {
      name: superChat.author.name.text,
      thumbnailUrl: superChat.author.thumbnails[0].url
    },
    superChat: {
      amount: superChat.purchase_amount,
      colorClass: getRandomColorClass()
    }
  }

  superChatComments.unshift(parsedComment)

  setTimeout(() => {
    removeFromSuperChat(parsedComment)
  }, 120000)

  pushComment(parsedComment)
}

/**
 * @param {any} comment
 */
function pushComment(comment) {
  comments.push(comment)

  if (!isLoading.value && stayAtBottom) {
    nextTick(() => {
      commentsRef.value?.scrollTo({
        top: commentsRef.value.scrollHeight,
        behavior: scrollingBehaviour.value
      })
    })
  }

  if (comments.length > 150 && stayAtBottom) {
    comments.splice(0, comments.length - 150)
  }
}

/**
 * @param {any} comment
 */
function removeFromSuperChat(comment) {
  const index = superChatComments.indexOf(comment)

  superChatComments.splice(index, 1)
}

/**
 * @param {any} comment
 */
function showSuperChatComment(comment) {
  if (superChat.value.id === comment.id && showSuperChat.value) {
    showSuperChat.value = false
  } else {
    superChat.value = comment
    showSuperChat.value = true
  }
}

/**
 * @param {any} event
 * @param {boolean} [isScrollEnd]
 */
function onScroll(event, isScrollEnd = false) {
  const liveChatComments = commentsRef.value
  if (event.wheelDelta >= 0 && stayAtBottom) {
    stayAtBottom = false

    if (liveChatComments.scrollHeight > liveChatComments.clientHeight) {
      showScrollToBottom.value = true
    }
  } else if ((isScrollEnd || event.wheelDelta < 0) && !stayAtBottom && (liveChatComments.scrollHeight - liveChatComments.scrollTop) === liveChatComments.clientHeight) {
    scrollToBottom()
  }
}

function hideSuperChat() {
  showSuperChat.value = false
}

function scrollToBottom() {
  commentsRef.value.scrollTo({
    top: commentsRef.value.scrollHeight,
    behavior: scrollingBehaviour.value
  })

  stayAtBottom = true
  showScrollToBottom.value = false
}
</script>

<style scoped src="./WatchVideoLiveChat.css" />
