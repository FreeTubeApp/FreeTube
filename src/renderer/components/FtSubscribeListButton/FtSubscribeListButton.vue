<template>
  <div
    ref="subscribeButton"
    class="ftSubscribeButton"
    @focusout="handleProfileDropdownFocusOut"
  >
    <div class="buttonList">
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
        :label="$t('Playlist.Unsubscribe Prompt', { listName: listName })"
        :option-names="[$t('Yes'), $t('No')]"
        :option-values="['yes', 'no']"
        :autosize="true"
        @click="handleUnsubscribeConfirmation"
      />

      <FtButton
        v-if="isProfileDropdownEnabled"
        :no-border="true"
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
      <ul class="profileList">
        <li
          v-for="(profile, index) in profileDisplayList"
          :key="index"
          class="profile"
          :class="{ subscribed: isProfileSubscribed(profile) }"
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
              dir="auto"
            >
              {{ isProfileSubscribed(profile)
                ? $t('checkmark')
                : profileInitials[profile._id]
              }}
            </div>
          </div>

          <p
            class="profileName"
            dir="auto"
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
import { computed, ref, shallowRef, useTemplateRef } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import FtButton from '../FtButton/FtButton.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'

import store from '../../store/index'
import { MAIN_PROFILE_ID } from '../../../constants'
import { showToast } from '../../helpers/utils'
import { getFirstCharacter } from '../../helpers/strings'

const { t, locale } = useI18n()

const props = defineProps({
  listId: { type: String, required: true },
  listName: { type: String, required: true },
  listThumbnail: { type: String, default: null },
  hideProfileDropdownToggle: { type: Boolean, default: false },
  openDropdownOnSubscribe: { type: Boolean, default: true }
})

const emit = defineEmits(['subscribedList'])

const profileList = computed(() => store.getters.getProfileList)
const activeProfile = computed(() => store.getters.getActiveProfile)

const profileDisplayList = computed(() => [
  profileList.value[0],
  ...(activeProfile.value._id !== MAIN_PROFILE_ID ? [activeProfile.value] : []),
  ...profileList.value.filter((profile, i) =>
    i !== 0 &&
    !isActiveProfile(profile) &&
    !isProfileSubscribed(profile)
  ),
  ...profileList.value.filter((profile, i) =>
    i !== 0 &&
    !isActiveProfile(profile) &&
    isProfileSubscribed(profile)
  )
])

const profileInitials = computed(() => {
  const locale_ = locale.value
  return profileList.value.reduce((acc, profile) => {
    acc[profile._id] = profile.name
      ? getFirstCharacter(profile.name, locale_)
      : ''
    return acc
  }, {})
})

const subscribedText = computed(() =>
  isProfileSubscribed(activeProfile.value)
    ? t('Playlist.Unsubscribe')
    : t('Playlist.Subscribe')
)

const isProfileDropdownEnabled = computed(() =>
  !props.hideProfileDropdownToggle && profileList.value.length > 1
)

const isProfileDropdownOpen = ref(false)
const showUnsubscribePopupForProfile = shallowRef(null)

function handleSubscription(profile) {
  if (!props.listId) return

  if (isProfileSubscribed(profile)) {
    showUnsubscribePopupForProfile.value = profile
  } else {
    const profileIds = [profile._id]

    store.dispatch('addListToProfiles', {
      list: {
        id: props.listId,
        name: props.listName,
        thumbnail: props.listThumbnail
      },
      profileIds
    })

    showToast(t('Playlist.List added'))
    emit('subscribedList')
  }

  if (
    isProfileDropdownEnabled.value &&
    props.openDropdownOnSubscribe &&
    !isProfileDropdownOpen.value
  ) {
    toggleProfileDropdown()
  }
}

function handleUnsubscribeConfirmation(value) {
  const profile = showUnsubscribePopupForProfile.value
  showUnsubscribePopupForProfile.value = null

  if (value === 'yes') {
    store.dispatch('removeListFromProfiles', {
      listId: props.listId,
      profileIds: [profile._id]
    })

    showToast(t('Playlist.List removed'))
  }
}

function isActiveProfile(profile) {
  return profile._id === activeProfile.value._id
}

function isProfileSubscribed(profile) {
  return (profile?.listSubscriptions ?? [])
    .filter(Boolean)
    .some((list) => list.id === props.listId)
}

const subscribeButton = useTemplateRef('subscribeButton')

function handleProfileDropdownFocusOut() {
  if (subscribeButton.value && !subscribeButton.value.matches(':focus-within')) {
    isProfileDropdownOpen.value = false
  }
}

function toggleProfileDropdown() {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value
}
</script>
