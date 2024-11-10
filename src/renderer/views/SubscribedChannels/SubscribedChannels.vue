<template>
  <div>
    <ft-card class="card">
      <h2>{{ $t('Channels.Title') }}</h2>
      <ft-input
        v-show="subscribedChannels.length > 0"
        ref="searchBarChannels"
        :placeholder="$t('Channels.Search bar placeholder')"
        :show-clear-text-button="true"
        :show-action-button="false"
        :spellcheck="false"
        :maxlength="255"
        @input="handleInput"
        @clear="query = ''"
      />
      <ft-flex-box
        v-if="activeSubscriptionList.length === 0"
      >
        <p class="message">
          {{ $t('Channels.Empty') }}
        </p>
      </ft-flex-box>
      <template v-else>
        <ft-flex-box class="count">
          {{ $t('Channels.Count', { number: channelList.length }) }}
        </ft-flex-box>
        <ft-flex-box class="channels">
          <div
            v-for="channel in channelList"
            :key="channel.id"
            class="channel"
          >
            <router-link
              tabindex="-1"
              class="thumbnailContainer"
              :to="`/channel/${channel.id}`"
            >
              <img
                v-if="channel.thumbnail != null"
                class="channelThumbnail"
                :src="thumbnailURL(channel.thumbnail)"
                alt=""
                @error.once="updateThumbnail(channel)"
              >
              <font-awesome-icon
                v-else
                class="channelThumbnail"
                :icon="['fas', 'circle-user']"
              />
            </router-link>
            <router-link
              class="channelName"
              :title="channel.name"
              :to="`/channel/${channel.id}`"
            >
              {{ channel.name }}
            </router-link>
            <div
              v-if="!hideUnsubscribeButton"
              class="unsubscribeContainer"
            >
              <ft-subscribe-button
                :channel-id="channel.id"
                :channel-name="channel.name"
                :channel-thumbnail="channel.thumbnail"
                :open-dropdown-on-subscribe="false"
              />
            </div>
          </div>
        </ft-flex-box>
      </template>
    </ft-card>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSubscribeButton from '../../components/ft-subscribe-button/ft-subscribe-button.vue'
import { invidiousGetChannelInfo, youtubeImageUrlToInvidious, invidiousImageUrlToInvidious } from '../../helpers/api/invidious'
import { getLocalChannel, parseLocalChannelHeader } from '../../helpers/api/local'
import { ctrlFHandler } from '../../helpers/utils'
import { useI18n } from '../../composables/use-i18n-polyfill.js'
import store from '../../store/index'

const { locale } = useI18n()

const re = {
  url: /(.+=\w)\d+(.+)/,
  ivToYt: /^.+ggpht\/(.+)/
}
const ytBaseURL = 'https://yt3.ggpht.com'
const thumbnailSize = 176
let errorCount = 0

const query = ref('')
const subscribedChannels = ref([])
const filteredChannels = ref([])

/** @type {import('vue').Ref<HTMLInputElement | null>} */
const searchBarChannels = ref(null)

/** @type {import('vue').ComputedRef<object>} */
const activeProfile = computed(() => {
  return store.getters.getActiveProfile
})

/** @type {import('vue').ComputedRef<string>} */
const activeProfileId = computed(() => {
  return activeProfile.value._id
})

/** @type {import('vue').ComputedRef<Array>} */
const activeSubscriptionList = computed(() => {
  return activeProfile.value.subscriptions
})

/** @type {import('vue').ComputedRef<Array>} */
const channelList = computed(() => {
  if (query.value !== '') {
    return filteredChannels.value
  } else {
    return subscribedChannels.value
  }
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideUnsubscribeButton = computed(() => {
  return store.getters.getHideUnsubscribeButton
})

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => {
  return store.getters.getCurrentInvidiousInstanceUrl
})

function getSubscription() {
  subscribedChannels.value = activeSubscriptionList.value.slice().sort((a, b) => {
    return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), locale.value)
  })
}

function handleInput(input) {
  query.value = input
  filterChannels()
}

function filterChannels() {
  if (query.value === '') {
    filteredChannels.value = []
    return
  }

  const escapedQuery = query.value.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&')
  const re = new RegExp(escapedQuery, 'i')
  filteredChannels.value = subscribedChannels.value.filter(channel => {
    return re.test(channel.name)
  })
}

function thumbnailURL(originalURL) {
  if (originalURL == null) { return null }
  let newURL = originalURL
  // Sometimes relative protocol URLs are passed in
  if (originalURL.startsWith('//')) {
    newURL = `https:${originalURL}`
  }
  const hostname = new URL(newURL).hostname
  if (hostname === 'yt3.ggpht.com' || hostname === 'yt3.googleusercontent.com') {
    if (backendPreference.value === 'invidious') { // YT to IV
      newURL = youtubeImageUrlToInvidious(newURL, currentInvidiousInstanceUrl.value)
    }
  } else {
    if (backendPreference.value === 'local') { // IV to YT
      newURL = newURL.replace(re.ivToYt, `${ytBaseURL}/$1`)
    } else { // IV to IV
      newURL = invidiousImageUrlToInvidious(newURL, currentInvidiousInstanceUrl.value)
    }
  }

  return newURL.replace(re.url, `$1${thumbnailSize}$2`)
}

function updateThumbnail(channel) {
  errorCount += 1
  if (backendPreference.value === 'local') {
    // avoid too many concurrent requests
    setTimeout(() => {
      getLocalChannel(channel.id).then(response => {
        if (!response.alert) {
          store.dispatch('updateSubscriptionDetails', {
            channelThumbnailUrl: thumbnailURL(parseLocalChannelHeader(response).thumbnailUrl),
            channelName: channel.name,
            channelId: channel.id
          })
        }
      })
    }, errorCount * 500)
  } else {
    setTimeout(() => {
      invidiousGetChannelInfo(channel.id).then(response => {
        store.dispatch('updateSubscriptionDetails', {
          channelThumbnailUrl: thumbnailURL(response.authorThumbnails[0].url),
          channelName: channel.name,
          channelId: channel.id
        })
      })
    }, errorCount * 500)
  }
}

function keyboardShortcutHandler(event) {
  ctrlFHandler(event, searchBarChannels.value)
}

watch(activeProfileId, () => {
  query.value = ''
  getSubscription()
})

watch(activeSubscriptionList, () => {
  getSubscription()
  filterChannels()
})

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
  getSubscription()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})
</script>
<style scoped src="./SubscribedChannels.css" />
