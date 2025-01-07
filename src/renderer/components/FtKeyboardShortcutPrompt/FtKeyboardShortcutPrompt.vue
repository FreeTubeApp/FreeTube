<template>
  <FtPrompt
    :label="$t('KeyboardShortcutPrompt.Keyboard Shortcuts')"
    @click="hideKeyboardShortcutPrompt"
  >
    <div class="titleAndCloseButton">
      <h2>
        {{ $t('KeyboardShortcutPrompt.Keyboard Shortcuts') }}
      </h2>
      <FtIconButton
        :title="$t('Close')"
        :icon="['fas', 'xmark']"
        theme="destructive"
        @click="hideKeyboardShortcutPrompt"
      />
    </div>
    <div
      v-if="primarySections"
      class="primarySections"
    >
      <div
        v-for="(primarySection, index) of primarySections"
        :key="index"
        class="primarySection"
      >
        <div
          v-for="secondarySection in primarySection.secondarySections"
          :key="secondarySection.title"
          class="secondarySection"
        >
          <h3 class="center">
            {{ secondarySection.title }}
          </h3>
          <div class="labelsAndShortcuts">
            <div
              v-for="[label, shortcut] in secondarySection.shortcutDictionary"
              :key="label"
              class="labelAndShortcut"
            >
              <p
                class="label"
              >
                {{ label }}
              </p>
              <p class="shortcut">
                {{ shortcut }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FtPrompt>
</template>

<script setup>

import { computed } from 'vue'
import { KeyboardShortcuts } from '../../../constants'
import { getLocalizedShortcut } from '../../helpers/utils'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import store from '../../store/index'
import { useI18n } from '../../composables/use-i18n-polyfill'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

const { t } = useI18n()

const generalPlayerShortcuts = computed(() =>
  getLocalizedShortcutNamesAndValues(KeyboardShortcuts.VIDEO_PLAYER.GENERAL)
)

const playbackPlayerShortcuts = computed(() =>
  getLocalizedShortcutNamesAndValues(KeyboardShortcuts.VIDEO_PLAYER.PLAYBACK)
)

const generalAppShortcuts = computed(() =>
  getLocalizedShortcutNamesAndValues(KeyboardShortcuts.APP.GENERAL)
)

const situationalAppShortcuts = computed(() =>
  getLocalizedShortcutNamesAndValues(KeyboardShortcuts.APP.SITUATIONAL)
)

const primarySections = computed(() => [
  {
    secondarySections: [
      {
        title: t('KeyboardShortcutPrompt.Sections.Video.Playback'),
        shortcutDictionary: playbackPlayerShortcuts.value
      },
      {
        title: t('KeyboardShortcutPrompt.Sections.Video.General'),
        shortcutDictionary: generalPlayerShortcuts.value
      },
    ]
  },
  {
    secondarySections: [
      {
        title: t('KeyboardShortcutPrompt.Sections.App.General'),
        shortcutDictionary: generalAppShortcuts.value
      },
      {
        title: t('KeyboardShortcutPrompt.Sections.App.Situational'),
        shortcutDictionary: situationalAppShortcuts.value
      }
    ]
  }
])

const isMac = process.platform === 'darwin'

const localizedShortcutNameDictionary = computed(() => {
  return new Map([
    ['SHOW_SHORTCUTS', t('KeyboardShortcutPrompt.Show Keyboard Shortcuts')],
    ['HISTORY_BACKWARD', t('KeyboardShortcutPrompt.History Backward')],
    ['HISTORY_FORWARD', t('KeyboardShortcutPrompt.History Forward')],
    ['FULLSCREEN', t('KeyboardShortcutPrompt.Fullscreen')],
    ['NAVIGATE_TO_SETTINGS', t('KeyboardShortcutPrompt.Navigate to Settings')],
    (
      isMac
        ? ['NAVIGATE_TO_HISTORY_MAC', t('KeyboardShortcutPrompt.Navigate to History')]
        : ['NAVIGATE_TO_HISTORY', t('KeyboardShortcutPrompt.Navigate to History')]
    ),
    ['NEW_WINDOW', t('KeyboardShortcutPrompt.New Window')],
    ['MINIMIZE_WINDOW', t('KeyboardShortcutPrompt.Minimize Window')],
    ['CLOSE_WINDOW', t('KeyboardShortcutPrompt.Close Window')],
    ['RESTART_WINDOW', t('KeyboardShortcutPrompt.Restart Window')],
    ['FORCE_RESTART_WINDOW', t('KeyboardShortcutPrompt.Force Restart Window')],
    ['TOGGLE_DEVTOOLS', t('KeyboardShortcutPrompt.Toggle Developer Tools')],
    ['RESET_ZOOM', t('KeyboardShortcutPrompt.Reset Zoom')],
    ['ZOOM_IN', t('KeyboardShortcutPrompt.Zoom In')],
    ['ZOOM_OUT', t('KeyboardShortcutPrompt.Zoom Out')],
    ['FOCUS_SEARCH', t('KeyboardShortcutPrompt.Focus Search')],
    ['SEARCH_IN_NEW_WINDOW', t('KeyboardShortcutPrompt.Search in New Window')],

    ['REFRESH', t('KeyboardShortcutPrompt.Refresh')],
    ['FOCUS_SECONDARY_SEARCH', t('KeyboardShortcutPrompt.Focus Secondary Search')],

    ['CAPTIONS', t('KeyboardShortcutPrompt.Captions')],
    ['THEATRE_MODE', t('KeyboardShortcutPrompt.Theatre Mode')],
    ['FULLSCREEN', t('KeyboardShortcutPrompt.Fullscreen')],
    ['FULLWINDOW', t('KeyboardShortcutPrompt.Full Window')],
    ['PICTURE_IN_PICTURE', t('KeyboardShortcutPrompt.Picture in Picture')],
    ['MUTE', t('KeyboardShortcutPrompt.Mute')],
    ['VOLUME_UP', t('KeyboardShortcutPrompt.Volume Up')],
    ['VOLUME_DOWN', t('KeyboardShortcutPrompt.Volume Down')],
    ['TAKE_SCREENSHOT', t('KeyboardShortcutPrompt.Take Screenshot')],
    ['STATS', t('KeyboardShortcutPrompt.Stats')],

    ['PLAY', t('KeyboardShortcutPrompt.Play')],
    ['LARGE_REWIND', t('KeyboardShortcutPrompt.Large Rewind')],
    ['LARGE_FAST_FORWARD', t('KeyboardShortcutPrompt.Large Fast Forward')],
    ['SMALL_REWIND', t('KeyboardShortcutPrompt.Small Rewind')],
    ['SMALL_FAST_FORWARD', t('KeyboardShortcutPrompt.Small Fast Forward')],
    ['DECREASE_VIDEO_SPEED', t('KeyboardShortcutPrompt.Decrease Video Speed')],
    ['INCREASE_VIDEO_SPEED', t('KeyboardShortcutPrompt.Increase Video Speed')],
    ['SKIP_N_TENTHS', t('KeyboardShortcutPrompt.Skip by Tenths')],
    ['LAST_CHAPTER', t('KeyboardShortcutPrompt.Last Chapter')],
    ['NEXT_CHAPTER', t('KeyboardShortcutPrompt.Next Chapter')],
    ['LAST_FRAME', t('KeyboardShortcutPrompt.Last Frame')],
    ['NEXT_FRAME', t('KeyboardShortcutPrompt.Next Frame')],
  ])
})

function hideKeyboardShortcutPrompt() {
  store.dispatch('hideKeyboardShortcutPrompt')
}

function getLocalizedShortcutNamesAndValues(dictionary) {
  const localizedDictionary = localizedShortcutNameDictionary.value
  return Object.entries(dictionary)
    .filter(([key]) =>
      localizedDictionary.has(key)
    )
    .map(([shortcutNameKey, shortcut]) => {
      const localizedShortcutName = localizedDictionary.get(shortcutNameKey)
      const localizedShortcut = getLocalizedShortcut(shortcut)
      return [localizedShortcutName, localizedShortcut]
    })
}

</script>

<style scoped src="./FtKeyboardShortcutPrompt.css" />
