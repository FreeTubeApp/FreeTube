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
          v-for="(channel, index) in errorChannels"
          :key="index"
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
        v-if="activeSubscriptionList.length === 0"
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
      :disable-refresh="isLoading || activeSubscriptionList.length === 0"
      :last-refresh-timestamp="lastRefreshTimestamp"
      :title="title"
      @click="refresh"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtRefreshWidget from '../ft-refresh-widget/ft-refresh-widget.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtElementList from '../FtElementList/FtElementList.vue'
import FtChannelBubble from '../ft-channel-bubble/ft-channel-bubble.vue'
import FtAutoLoadNextPageWrapper from '../ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import store from '../../store/index'

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

const emit = defineEmits('refresh')

const dataLimit = ref(100)

const activeVideoList = computed(() => {
  if (props.videoList.length < dataLimit.value) {
    return props.videoList
  } else {
    return props.videoList.slice(0, dataLimit.value)
  }
})

/** @type {import('vue').ComputedRef<object>} */
const activeProfile = computed(() => {
  return store.getters.getActiveProfile
})

/** @type {import('vue').ComputedRef<Array>} */
const activeSubscriptionList = computed(() => {
  return activeProfile.value.subscriptions
})

/** @type {import('vue').ComputedRef<boolean>} */
const fetchSubscriptionsAutomatically = computed(() => {
  return store.getters.getFetchSubscriptionsAutomatically
})

onBeforeMount(() => {
  const sessionDataLimit = sessionStorage.getItem('subscriptionLimit')

  if (sessionDataLimit !== null) {
    dataLimit.value = sessionDataLimit
  } else {
    dataLimit.value = props.initialDataLimit
  }
})

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})

function increaseLimit() {
  dataLimit.value += props.initialDataLimit
  sessionStorage.setItem('subscriptionLimit', dataLimit.value)
}

/**
 * This function `keyboardShortcutHandler` should always be at the bottom of this file
 * @param {KeyboardEvent} event the keyboard event
 */
function keyboardShortcutHandler(event) {
  if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
    return
  }
  // Avoid handling events due to user holding a key (not released)
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
  if (event.repeat) { return }

  switch (event.key) {
    case 'r':
    case 'R':
    case 'F5':
      if (!props.isLoading && activeSubscriptionList.value.length > 0) {
        refresh()
      }
      break
  }
}

function refresh() {
  emit('refresh')
}
</script>
<style scoped src="./SubscriptionsTabUi.css" />
