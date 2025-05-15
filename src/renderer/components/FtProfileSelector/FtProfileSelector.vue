<template>
  <div>
    <div
      ref="iconButton"
      class="colorOption"
      :title="$t('Profile.Toggle Profile List')"
      :style="{ background: activeProfile.bgColor, color: activeProfile.textColor }"
      tabindex="0"
      role="button"
      :aria-expanded="profileListShown"
      :aria-controls="id + 'list'"
      @click="toggleProfileList"
      @mousedown="handleIconMouseDown"
      @keydown.space.prevent="toggleProfileList"
      @keydown.enter.prevent="toggleProfileList"
    >
      <div
        class="initial"
      >
        {{ activeProfileInitial }}
      </div>
    </div>
    <FtCard
      v-show="profileListShown"
      :id="id + 'list'"
      ref="profileListRef"
      class="profileList"
      tabindex="-1"
      @focusout.native="handleProfileListFocusOut"
      @keydown.native.esc.stop="handleProfileListEscape"
    >
      <h3
        :id="id + 'title'"
        class="profileListTitle"
      >
        {{ $t("Profile.Profile Select") }}
      </h3>
      <FtIconButton
        class="profileSettings"
        :icon="['fas', 'sliders-h']"
        @click="openProfileSettings"
      />
      <div
        class="profileWrapper"
        role="listbox"
        :aria-labelledby="id + 'title'"
      >
        <div
          v-for="profile in profileList"
          :key="profile._id"
          class="profile"
          :aria-labelledby="id + profile._id"
          :aria-selected="isActiveProfile(profile)"
          tabindex="0"
          role="option"
          :data-profile-id="profile._id"
          @click="setActiveProfile"
          @keydown.enter.prevent="setActiveProfile"
        >
          <div
            class="colorOption"
            :style="{ background: profile.bgColor, color: profile.textColor }"
          >
            <div
              class="initial"
            >
              {{ profileInitials[profile._id] }}
            </div>
          </div>
          <p
            :id="id + profile._id"
            class="profileName"
          >
            {{ translateProfileName(profile) }}
          </p>
        </div>
      </div>
    </FtCard>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useId } from '../../composables/use-id-polyfill'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { useRouter } from 'vue-router/composables'

import FtCard from '../ft-card/ft-card.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

import store from '../../store/index'

import { showToast } from '../../helpers/utils'
import { MAIN_PROFILE_ID } from '../../../constants'
import { getFirstCharacter } from '../../helpers/strings'

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

const id = useId()

const profileListShown = ref(false)
let mouseDownOnIcon = false

/** @type {import('vue').ComputedRef<Profile[]>} */
const profileList = computed(() => store.getters.getProfileList)
/** @type {import('vue').ComputedRef<Profile>} */
const activeProfile = computed(() => store.getters.getActiveProfile)

const activeProfileInitial = computed(() => {
  return activeProfile.value?.name
    ? getFirstCharacter(translateProfileName(activeProfile.value), locale.value).toUpperCase()
    : ''
})

/** @type {import('vue').ComputedRef<Record<Profile['_id'], string>>} */
const profileInitials = computed(() => {
  const locale_ = locale.value

  return profileList.value.reduce((initials, profile) => {
    initials[profile._id] = profile?.name
      ? getFirstCharacter(translateProfileName(profile), locale_).toUpperCase()
      : ''

    return initials
  }, {})
})

/**
 * @param {Profile} profile
 */
function isActiveProfile(profile) {
  return profile._id === activeProfile.value._id
}

const profileListRef = ref(null)

function toggleProfileList() {
  profileListShown.value = !profileListShown.value

  if (profileListShown.value) {
    // wait until the profile list is visible
    // then focus it so we can hide it automatically when it loses focus
    nextTick(() => {
      profileListRef.value?.$el?.focus()
    })
  }
}

const router = useRouter()

function openProfileSettings() {
  router.push({ path: '/settings/profile' })
  profileListShown.value = false
}

function handleIconMouseDown() {
  if (profileListShown.value) {
    mouseDownOnIcon = true
  }
}

function handleProfileListFocusOut() {
  if (mouseDownOnIcon) {
    mouseDownOnIcon = false
  } else if (!profileListRef.value?.$el.matches(':focus-within')) {
    profileListShown.value = false
  }
}

/** @type {import('vue').Ref<HTMLDivElement | null>} */
const iconButton = ref(null)

function handleProfileListEscape() {
  iconButton.value?.focus()
  // handleProfileListFocusOut will hide the dropdown for us
}

/**
 * @param {MouseEvent | KeyboardEvent} event
 */
function setActiveProfile(event) {
  /** @type {string} */
  const profileId = event.currentTarget.dataset.profileId

  if (activeProfile.value._id !== profileId) {
    const targetProfile = profileList.value.find((x) => {
      return x._id === profileId
    })

    if (targetProfile) {
      store.commit('setActiveProfile', profileId)

      showToast(t('Profile.{profile} is now the active profile', { profile: translateProfileName(targetProfile) }))
    }
  }

  profileListShown.value = false
}

/**
 * @param {Profile} profile
 */
function translateProfileName(profile) {
  return profile._id === MAIN_PROFILE_ID ? t('Profile.All Channels') : profile.name
}
</script>

<style scoped src="./FtProfileSelector.css" />
