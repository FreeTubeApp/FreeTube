<template>
  <div>
    <FtLoader
      v-if="isLoading"
    />
    <div
      v-if="!isLoading && errorChannels.length !== 0"
    >
      <h3> {{ $t("Subscriptions.Error Channels") }}</h3>
      <FtFlexBox>
        <FtChannelBubble
          v-for="channel in errorChannels"
          :key="channel.id"
          :channel-name="channel.name"
          :channel-id="channel.id"
          :channel-thumbnail="channel.thumbnail"
        />
      </FtFlexBox>
    </div>
    <FtFlexBox
      v-if="!isLoading && activeVideoList.length === 0"
    >
      <p
        v-if="!activeProfileHasSubscriptions"
        class="message"
      >
        {{ $t("Subscriptions['Your Subscription list is currently empty. Start adding subscriptions to see them here.']") }}
      </p>
      <p
        v-else-if="!fetchSubscriptionsAutomatically && !attemptedFetch"
        class="message"
      >
        {{ $t("Subscriptions.Disabled Automatic Fetching") }}
      </p>
      <p
        v-else
        class="message"
      >
        {{ isCommunity ? $t("Subscriptions.Empty Posts") : $t("Subscriptions.Empty Channels") }}
      </p>
    </FtFlexBox>
    <FtElementList
      v-if="!isLoading && activeVideoList.length > 0"
      :data="activeVideoList"
      :use-channels-hidden-preference="false"
      :display="isCommunity ? 'list' : ''"
    />
    <FtAutoLoadNextPageWrapper
      v-if="!isLoading && videoList.length > dataLimit"
      @load-next-page="increaseLimit"
    >
      <FtFlexBox>
        <FtButton
          :label="isCommunity ? $t('Subscriptions.Load More Posts') : $t('Subscriptions.Load More Videos')"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="increaseLimit"
        />
      </FtFlexBox>
    </FtAutoLoadNextPageWrapper>

    <FtRefreshWidget
      :disable-refresh="isLoading || !activeProfileHasSubscriptions"
      :last-refresh-timestamp="lastRefreshTimestamp"
      :title="title"
      @click="refresh"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import FtAutoLoadNextPageWrapper from '../FtAutoLoadNextPageWrapper.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtChannelBubble from '../FtChannelBubble/FtChannelBubble.vue'
import FtElementList from '../FtElementList/FtElementList.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtLoader from '../FtLoader/FtLoader.vue'
import FtRefreshWidget from '../FtRefreshWidget/FtRefreshWidget.vue'

import store from '../../store/index'

import { KeyboardShortcuts } from '../../../constants'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  videoList: {
    type: Array,
    default: () => []
  },
  isCommunity: {
    type: Boolean,
    default: false
  },
  errorChannels: {
    type: Array,
    default: () => []
  },
  attemptedFetch: {
    type: Boolean,
    default: false
  },
  initialDataLimit: {
    type: Number,
    default: 100
  },
  lastRefreshTimestamp: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const subscriptionLimit = sessionStorage.getItem('subscriptionLimit')

const dataLimit = ref(subscriptionLimit !== null ? parseInt(subscriptionLimit) : props.initialDataLimit)

const activeVideoList = computed(() => {
  if (filteredVideoList.value.length < dataLimit.value) {
    return filteredVideoList.value
  } else {
    return filteredVideoList.value.slice(0, dataLimit.value)
  }
})

const activeProfileHasSubscriptions = computed(() => {
  return store.getters.getActiveProfile.subscriptions.length > 0
})

/** @type {import('vue').ComputedRef<boolean>} */
const fetchSubscriptionsAutomatically = computed(() => {
  return store.getters.getFetchSubscriptionsAutomatically
})

const historyCacheById = computed(() => {
  return store.getters.getHistoryCacheById
})

const hideWatchedSubs = computed(() => {
  return store.getters.getHideWatchedSubs
})

const filteredVideoList = computed(() => {
  if (hideWatchedSubs.value && !props.isCommunity) {
    return props.videoList.filter((video) => {
      return !Object.hasOwn(historyCacheById.value, video.videoId)
    })
  } else {
    return props.videoList
  }
})

function increaseLimit() {
  dataLimit.value += props.initialDataLimit
  sessionStorage.setItem('subscriptionLimit', dataLimit.value.toFixed(0))
}

/**
 * @param {KeyboardEvent} event
 */
function keyboardShortcutHandler(event) {
  if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
    return
  }
  // Avoid handling events due to user holding a key (not released)
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
  if (event.repeat) { return }

  switch (event.key.toLowerCase()) {
    case 'f5':
    case KeyboardShortcuts.APP.SITUATIONAL.REFRESH:
      if (!props.isLoading && activeProfileHasSubscriptions.value) {
        refresh()
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})

function refresh() {
  emit('refresh')
}
</script>

<style scoped src="./SubscriptionsTabUi.css" />
