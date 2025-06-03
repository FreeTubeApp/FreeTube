<template>
  <div>
    <FtCard class="card">
      <h2>
        {{ $t("Profile.Subscription List") }}
      </h2>
      <p class="selectedCount">
        {{ selectedText }}
      </p>
      <FtFlexBox>
        <FtChannelBubble
          v-for="channel in subscriptions"
          :key="channel.id"
          :channel-id="channel.id"
          :channel-name="channel.name"
          :channel-thumbnail="channel.thumbnail"
          selectable
          :selected="selected.includes(channel.id)"
          @change="handleChannelToggle(channel.id)"
        />
      </FtFlexBox>
      <FtFlexBox>
        <FtButton
          :label="$t('Profile.Select All')"
          @click="selectAll"
        />
        <FtButton
          :label="$t('Profile.Select None')"
          @click="selectNone"
        />
        <FtButton
          :label="$t('Profile.Delete Selected')"
          text-color="var(--destructive-text-color)"
          background-color="var(--destructive-color)"
          @click="displayDeletePrompt"
        />
      </FtFlexBox>
    </FtCard>
    <FtPrompt
      v-if="showDeletePrompt"
      :label="deletePromptMessage"
      :option-names="deletePromptNames"
      :option-values="DELTE_PROMPT_VALUES"
      :is-first-option-destructive="true"
      @click="handleDeletePromptClick"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../FtChannelBubble/FtChannelBubble.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'

import store from '../../store/index'

import { deepCopy, showToast } from '../../helpers/utils'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'

/**
 * @typedef {object} Profile
 * @property {string} _id
 * @property {string} name
 * @property {string} bgColor
 * @property {string} textColor
 * @property {object[]} subscriptions
 * @property {string} subscriptions[].id
 * @property {string|undefined} subscriptions[].name
 * @property {string|undefined} subscriptions[].thumbnail
 */

const { locale, t } = useI18n()

const props = defineProps({
  profile: {
    type: Object,
    required: true
  },
  isMainProfile: {
    type: Boolean,
    required: true
  }
})

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => {
  return store.getters.getCurrentInvidiousInstanceUrl
})

const intlCollator = computed(() => {
  return new Intl.Collator([locale.value, 'en'], { sensitivity: 'base' })
})

/** @type {import('vue').Ref<Profile['subscriptions']>} */
const subscriptions = ref([])

function loadSubscriptions() {
  /** @type {Profile['subscriptions']} */
  const subscriptions_ = deepCopy(props.profile.subscriptions)

  const collator = intlCollator.value

  subscriptions_.sort((a, b) => collator.compare(a.name, b.name))

  if (backendPreference.value === 'invidious') {
    const instanceUrl = currentInvidiousInstanceUrl.value

    subscriptions_.forEach((channel) => {
      channel.thumbnail = youtubeImageUrlToInvidious(channel.thumbnail, instanceUrl)
    })
  }

  subscriptions.value = subscriptions_
}

if (typeof props.profile.subscriptions !== 'undefined') {
  loadSubscriptions()
}

watch(() => props.profile, () => {
  loadSubscriptions()
  selectNone()
}, { deep: true })

/**
 * TODO: Replace with a Set with Vue 3
 *
 * @type {import('vue').Ref<string[]>}
 */
const selected = ref([])

const selectedText = computed(() => {
  return t('Profile.{number} selected', { number: selected.value.length })
})

function selectAll() {
  selected.value = subscriptions.value.map(channel => channel.id)
}

function selectNone() {
  selected.value = []
}

/**
 * @param {string} channelId
 */
function handleChannelToggle(channelId) {
  const index = selected.value.indexOf(channelId)

  if (index === -1) {
    selected.value.push(channelId)
  } else {
    selected.value.splice(index, 1)
  }
}

const DELTE_PROMPT_VALUES = ['delete', 'cancel']

const deletePromptNames = computed(() => [
  t('Yes, Delete'),
  t('Cancel')
])

/** @type {import('vue').ComputedRef<Profile[]>} */
const profileList = computed(() => {
  return store.getters.getProfileList
})

const showDeletePrompt = ref(false)

const deletePromptMessage = computed(() => {
  if (props.isMainProfile) {
    return t('Profile["This is your primary profile.  Are you sure you want to delete the selected channels?  The same channels will be deleted in any profile they are found in."]')
  } else {
    return t('Profile["Are you sure you want to delete the selected channels?  This will not delete the channel from any other profile."]')
  }
})

function displayDeletePrompt() {
  if (selected.value.length === 0) {
    showToast(t('Profile.No channel(s) have been selected'))
  } else {
    showDeletePrompt.value = true
  }
}

/**
 * @param {'delete' | 'cancel' | null} value
 */
function handleDeletePromptClick(value) {
  if (value === 'delete') {
    const selected_ = selected.value

    if (props.isMainProfile) {
      subscriptions.value = subscriptions.value.filter((channel) => {
        return !selected_.includes(channel.id)
      })

      profileList.value.forEach((x) => {
        const profile = deepCopy(x)

        profile.subscriptions = profile.subscriptions.filter((channel) => {
          return !selected_.includes(channel.id)
        })

        // Only update changed profiles
        if (x.subscriptions.length !== profile.subscriptions.length) {
          store.dispatch('updateProfile', profile)
        }
      })

      showToast(t('Profile.Profile has been updated'))
      selectNone()
    } else {
      /** @type {Profile} */
      const profile = deepCopy(props.profile)

      subscriptions.value = subscriptions.value.filter((channel) => {
        return !selected_.includes(channel.id)
      })

      profile.subscriptions = subscriptions.value

      store.dispatch('updateProfile', profile)

      showToast(t('Profile.Profile has been updated'))
      selectNone()
    }
  }

  showDeletePrompt.value = false
}
</script>

<style scoped src="./FtProfileChannelList.css" />
