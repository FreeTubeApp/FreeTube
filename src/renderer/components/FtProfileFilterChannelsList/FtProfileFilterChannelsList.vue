<template>
  <div>
    <FtCard class="card">
      <h2>
        {{ $t("Profile.Other Channels") }}
      </h2>
      <FtFlexBox>
        <FtSelect
          :placeholder="$t('Profile.Profile Filter')"
          :value="profileIdList[filteredProfileIndex]"
          :select-names="profileNameList"
          :select-values="profileIdList"
          :icon="['fas', 'filter']"
          @change="handleProfileFilterChange"
        />
      </FtFlexBox>
      <p class="selected">
        {{ selectedText }}
      </p>
      <FtFlexBox>
        <FtChannelBubble
          v-for="channel in channels"
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
          :label="$t('Profile.Add Selected To Profile')"
          text-color="var(--text-with-main-color)"
          background-color="var(--primary-color)"
          @click="addChannelsToProfile"
        />
      </FtFlexBox>
    </FtCard>
  </div>
</template>

<script setup>
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../FtChannelBubble/FtChannelBubble.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtSelect from '../FtSelect/FtSelect.vue'

import store from '../../store/index'

import { deepCopy, showToast } from '../../helpers/utils'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { MAIN_PROFILE_ID } from '../../../constants'

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
  }
})

/** @type {import('vue').ComputedRef<Profile[]>} */
const profileList = computed(() => {
  return store.getters.getProfileList
})

/** @type {import('vue').ShallowRef<string[]>} */
const profileIdList = shallowRef([])

/** @type {import('vue').ShallowRef<string[]>} */
const profileNameList = shallowRef([])

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

const filteredProfileIndex = ref(0)

/** @type {import('vue').Ref<Profile['subscriptions']>} */
const channels = ref([])

function loadChannels() {
  const profileId = profileIdList.value[filteredProfileIndex.value]
  const profile = profileList.value.find((profile) => profile._id === profileId)

  /** @type {Profile['subscriptions']} */
  let channels_ = deepCopy(profile.subscriptions)

  channels_ = channels_.filter((channel) => {
    return !props.profile.subscriptions.some((sub) => sub.id === channel.id)
  })

  const collator = intlCollator.value

  channels_.sort((a, b) => collator.compare(a.name, b.name))

  if (backendPreference.value === 'invidious') {
    const instanceUrl = currentInvidiousInstanceUrl.value

    channels_.forEach((channel) => {
      channel.thumbnail = youtubeImageUrlToInvidious(channel.thumbnail, instanceUrl)
    })
  }

  channels.value = channels_
}

fillProfileList()

if (typeof props.profile.subscriptions !== 'undefined') {
  loadChannels()
}

watch(() => props.profile, () => {
  loadChannels()
  selectNone()
}, { deep: true })

watch(filteredProfileIndex, loadChannels)

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
  selected.value = channels.value.map(channel => channel.id)
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

watch(profileList, fillProfileList, { deep: true })
watch(() => props.profile, fillProfileList, { deep: true })

function fillProfileList() {
  const profiles = profileList.value.filter((profile) => profile._id !== props.profile._id)

  profileIdList.value = profiles.map((profile) => profile._id)
  profileNameList.value = profiles.map(translateProfileName)
}

/**
 * @param {Profile} profile
 */
function translateProfileName(profile) {
  return profile._id === MAIN_PROFILE_ID ? t('Profile.All Channels') : profile.name
}

/**
 * @param {string} profileId
 */
function handleProfileFilterChange(profileId) {
  selectNone()
  filteredProfileIndex.value = profileIdList.value.indexOf(profileId)
}

function addChannelsToProfile() {
  if (selected.value.length === 0) {
    showToast(t('Profile.No channel(s) have been selected'))
  } else {
    const selected_ = selected.value

    const profileId = profileIdList.value[filteredProfileIndex.value]
    const subscriptions = profileList.value
      .find((profile) => profile._id === profileId)
      .subscriptions
      .filter((channel) => selected_.includes(channel.id))

    const profile = deepCopy(props.profile)
    profile.subscriptions.push(...deepCopy(subscriptions))

    store.dispatch('updateProfile', profile)
    showToast(t('Profile.Profile has been updated'))
    selectNone()
  }
}
</script>

<style scoped src="./FtProfileFilterChannelsList.css" />
