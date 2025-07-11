<template>
  <div
    ref="subscribeButton"
    class="ftSubscribeButton"
    @focusout="handleProfileDropdownFocusOut"
  >
    <div
      class="buttonList"
    >
      <FtButton
        :label="subscribedText"
        :no-border="true"
        class="subscribeButton"
        :class="{
          hasProfileDropdownToggle: isProfileDropdownEnabled,
          dropdownOpened: isProfileDropdownOpen
        }"
        background-color="var(--primary-color)"
        text-color="var(--text-with-main-color)"
        @click="handleSubscription(activeProfile)"
      />
      <FtPrompt
        v-if="showUnsubscribePopupForProfile !== null"
        :label="$t('Channels.Unsubscribe Prompt', { channelName: channelName })"
        :option-names="[$t('Yes'), $t('No')]"
        :option-values="['yes', 'no']"
        :autosize="true"
        @click="handleUnsubscribeConfirmation"
      />
      <FtButton
        v-if="isProfileDropdownEnabled"
        :no-border="true"
        :title="isProfileDropdownOpen ? $t('Profile.Close Profile Dropdown') : $t('Profile.Open Profile Dropdown')"
        class="profileDropdownToggle"
        :class="{ dropdownOpened: isProfileDropdownOpen}"
        background-color="var(--primary-color)"
        text-color="var(--text-with-main-color)"
        :aria-expanded="isProfileDropdownOpen"
        @click="toggleProfileDropdown"
      >
        <FontAwesomeIcon
          :icon="isProfileDropdownOpen ? ['fas', 'angle-up'] : ['fas', 'angle-down']"
        />
      </FtButton>
    </div>
    <div
      v-if="isProfileDropdownOpen"
      tabindex="-1"
      class="profileDropdown"
    >
      <ul
        class="profileList"
      >
        <li
          v-for="(profile, index) in profileDisplayList"
          :key="index"
          class="profile"
          :class="{
            subscribed: isProfileSubscribed(profile)
          }"
          :aria-labelledby="id + '-' + index"
          :aria-selected="isActiveProfile(profile)"
          :aria-checked="isProfileSubscribed(profile)"
          tabindex="0"
          role="checkbox"
          @click.stop.prevent="handleSubscription(profile)"
          @keydown.space.stop.prevent="handleSubscription(profile)"
        >
          <div
            class="colorOption"
            :style="{ background: profile.bgColor, color: profile.textColor }"
          >
            <div
              class="initial"
            >
              {{ isProfileSubscribed(profile) ? $t('checkmark') : profileInitials[profile._id] }}
            </div>
          </div>
          <p
            :id="id + '-' + index"
            class="profileName"
          >
            {{ profile.name }}
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, ref, shallowRef } from 'vue'
import { useId } from '../../composables/use-id-polyfill'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtButton from '../FtButton/FtButton.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'

import store from '../../store/index'

import { MAIN_PROFILE_ID } from '../../../constants'
import { showToast } from '../../helpers/utils'
import { getFirstCharacter } from '../../helpers/strings'

const { locale, t } = useI18n()

const props = defineProps({
  channelId: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelThumbnail: {
    type: String,
    default: null
  },
  hideProfileDropdownToggle: {
    type: Boolean,
    default: false
  },
  openDropdownOnSubscribe: {
    type: Boolean,
    default: true
  },
  subscriptionCountText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['subscribed'])

const id = useId()

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

/** @type {import('vue').ComputedRef<Profile[]>} */
const profileList = computed(() => {
  return store.getters.getProfileList
})

/** @type {import('vue').ComputedRef<Profile>} */
const activeProfile = computed(() => {
  return store.getters.getActiveProfile
})

const profileDisplayList = computed(() => [
  profileList.value[0],
  ...(activeProfile.value._id !== MAIN_PROFILE_ID ? [activeProfile.value] : []),
  ...profileList.value.filter((profile, i) => i !== 0 && !isActiveProfile(profile) && !isProfileSubscribed(profile)),
  ...profileList.value.filter((profile, i) => i !== 0 && !isActiveProfile(profile) && isProfileSubscribed(profile))
])

const profileInitials = computed(() => {
  const locale_ = locale.value

  return profileList.value.reduce((accumulator, profile) => {
    accumulator[profile._id] = profile.name
      ? getFirstCharacter(profile.name, locale_).toUpperCase()
      : ''

    return accumulator
  }, {})
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelSubscriptions = computed(() => {
  return store.getters.getHideChannelSubscriptions
})

const subscribedText = computed(() => {
  let subscribedValue = (isProfileSubscribed(activeProfile.value) ? t('Channel.Unsubscribe') : t('Channel.Subscribe')).toUpperCase()
  if (props.subscriptionCountText !== '' && !hideChannelSubscriptions.value) {
    subscribedValue += ' ' + props.subscriptionCountText
  }
  return subscribedValue
})

const isProfileDropdownEnabled = computed(() => {
  return !props.hideProfileDropdownToggle && profileList.value.length > 1
})

const isProfileDropdownOpen = ref(false)
/** @type {import('vue').ShallowRef<Profile | null>} */
const showUnsubscribePopupForProfile = shallowRef(null)

/**
 * @param {Profile} profile
 */
function handleSubscription(profile) {
  if (props.channelId === '') {
    return
  }

  if (isProfileSubscribed(profile)) {
    if (store.getters.getUnsubscriptionPopupStatus) {
      showUnsubscribePopupForProfile.value = profile
    } else {
      handleUnsubscription(profile)
    }
  } else {
    const profileIds = [profile._id]

    if (profile._id !== MAIN_PROFILE_ID) {
      const primaryProfile = profileList.value.find(prof => {
        return prof._id === MAIN_PROFILE_ID
      })

      if (!isProfileSubscribed(primaryProfile)) {
        profileIds.push(MAIN_PROFILE_ID)
      }
    }

    store.dispatch('addChannelToProfiles', {
      channel: {
        id: props.channelId,
        name: props.channelName,
        thumbnail: props.channelThumbnail
      },
      profileIds
    })

    showToast(t('Channel.Added channel to your subscriptions'))
    emit('subscribed')
  }

  if (isProfileDropdownEnabled.value && props.openDropdownOnSubscribe && !isProfileDropdownOpen.value) {
    toggleProfileDropdown()
  }
}

const subscribeButton = ref(null)

function handleProfileDropdownFocusOut() {
  if (!subscribeButton.value.matches(':focus-within')) {
    isProfileDropdownOpen.value = false
  }
}

function toggleProfileDropdown() {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value
}

/**
 * @param {'yes' | 'no' | null} value
 */
function handleUnsubscribeConfirmation(value) {
  const profile = showUnsubscribePopupForProfile.value
  showUnsubscribePopupForProfile.value = null

  if (value === 'yes') {
    handleUnsubscription(profile)
  }
}

/**
 * @param {Profile} profile
 */
function handleUnsubscription(profile) {
  const profileIds = [profile._id]

  if (profile._id === MAIN_PROFILE_ID) {
    // Check if a subscription exists in a different profile.
    // Remove from there as well.

    profileList.value.forEach((profileInList) => {
      if (profileInList._id === MAIN_PROFILE_ID) {
        return
      }

      if (isProfileSubscribed(profileInList)) {
        profileIds.push(profileInList._id)
      }
    })
  }

  store.dispatch('removeChannelFromProfiles', { channelId: props.channelId, profileIds })

  showToast(t('Channel.Channel has been removed from your subscriptions'))

  if (profile._id === MAIN_PROFILE_ID && profileIds.length > 1) {
    showToast(t('Channel.Removed subscription from {count} other channel(s)', { count: profileIds.length - 1 }))
  }
}

/**
 * @param {Profile} profile
 */
function isActiveProfile(profile) {
  return profile._id === activeProfile.value._id
}

/**
 * @param {Profile} profile
 */
function isProfileSubscribed(profile) {
  const channelId = props.channelId

  return profile.subscriptions.some((channel) => channel.id === channelId)
}
</script>

<style scoped src="./FtSubscribeButton.css" />
