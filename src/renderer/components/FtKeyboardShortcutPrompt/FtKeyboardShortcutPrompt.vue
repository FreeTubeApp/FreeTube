<template>
  <FtPrompt
    :label="$t('KeyboardShortcutPrompt.Keyboard Shortcuts')"
    @click="hideKeyboardShortcutPrompt"
  >
    <template #label="{ labelId }">
      <div class="titleAndCloseButton">
        <h2 :id="labelId">
          {{ $t('KeyboardShortcutPrompt.Keyboard Shortcuts') }}
        </h2>
        <FtIconButton
          :title="$t('Close')"
          :icon="['fas', 'xmark']"
          theme="destructive"
          @click="hideKeyboardShortcutPrompt"
        />
      </div>
    </template>

    <div class="primarySections">
      <div
        v-for="(primarySection, index) of primarySections"
        :key="index"
        class="primarySection"
      >
        <div
          v-for="secondarySection in primarySection"
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
import FtPrompt from '../FtPrompt/FtPrompt.vue'
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
  [
    {
      title: t('KeyboardShortcutPrompt.Sections.Video.Playback'),
      shortcutDictionary: playbackPlayerShortcuts.value
    },
    {
      title: t('KeyboardShortcutPrompt.Sections.Video.General'),
      shortcutDictionary: generalPlayerShortcuts.value
    },
  ],
  [
    {
      title: t('KeyboardShortcutPrompt.Sections.App.General'),
      shortcutDictionary: generalAppShortcuts.value
    },
    {
      title: t('KeyboardShortcutPrompt.Sections.App.Situational'),
      shortcutDictionary: situationalAppShortcuts.value
    }
  ]
])

const isMac = process.platform === 'darwin'

const localizedShortcutNameToShortcutsMappings = computed(() => {
  return [
    [t('KeyboardShortcutPrompt.Show Keyboard Shortcuts'), ['SHOW_SHORTCUTS']],
    [t('KeyboardShortcutPrompt.History Backward'), [
      'HISTORY_BACKWARD',
      ...isMac ? ['HISTORY_BACKWARD_ALT_MAC'] : [],
    ]],
    [t('KeyboardShortcutPrompt.History Forward'), [
      'HISTORY_FORWARD',
      ...isMac ? ['HISTORY_FORWARD_ALT_MAC'] : [],
    ]],
    [t('KeyboardShortcutPrompt.Navigate to Settings'), ['NAVIGATE_TO_SETTINGS']],
    [t('KeyboardShortcutPrompt.Navigate to History'), [
      isMac ? 'NAVIGATE_TO_HISTORY_MAC' : 'NAVIGATE_TO_HISTORY',
    ]],
    [t('KeyboardShortcutPrompt.New Window'), ['NEW_WINDOW']],
    [t('KeyboardShortcutPrompt.Minimize Window'), ['MINIMIZE_WINDOW']],
    [t('KeyboardShortcutPrompt.Close Window'), ['CLOSE_WINDOW']],
    [t('KeyboardShortcutPrompt.Restart Window'), ['RESTART_WINDOW']],
    [t('KeyboardShortcutPrompt.Force Restart Window'), ['FORCE_RESTART_WINDOW']],
    [t('KeyboardShortcutPrompt.Toggle Developer Tools'), ['TOGGLE_DEVTOOLS']],
    [t('KeyboardShortcutPrompt.Reset Zoom'), ['RESET_ZOOM']],
    [t('KeyboardShortcutPrompt.Zoom In'), ['ZOOM_IN']],
    [t('KeyboardShortcutPrompt.Zoom Out'), ['ZOOM_OUT']],
    [t('KeyboardShortcutPrompt.Focus Search'), ['FOCUS_SEARCH']],
    [t('KeyboardShortcutPrompt.Search in New Window'), ['SEARCH_IN_NEW_WINDOW']],

    [t('KeyboardShortcutPrompt.Refresh'), ['REFRESH']],
    [t('KeyboardShortcutPrompt.Focus Secondary Search'), ['FOCUS_SECONDARY_SEARCH']],

    [t('KeyboardShortcutPrompt.Captions'), ['CAPTIONS']],
    [t('KeyboardShortcutPrompt.Theatre Mode'), ['THEATRE_MODE']],
    [t('KeyboardShortcutPrompt.Fullscreen'), ['FULLSCREEN']],
    [t('KeyboardShortcutPrompt.Full Window'), ['FULLWINDOW']],
    [t('KeyboardShortcutPrompt.Picture in Picture'), ['PICTURE_IN_PICTURE']],
    [t('KeyboardShortcutPrompt.Mute'), ['MUTE']],
    [t('KeyboardShortcutPrompt.Volume Up'), ['VOLUME_UP']],
    [t('KeyboardShortcutPrompt.Volume Down'), ['VOLUME_DOWN']],
    [t('KeyboardShortcutPrompt.Take Screenshot'), ['TAKE_SCREENSHOT']],
    [t('KeyboardShortcutPrompt.Stats'), ['STATS']],

    [t('KeyboardShortcutPrompt.Play'), ['PLAY']],
    [t('KeyboardShortcutPrompt.Large Rewind'), ['LARGE_REWIND']],
    [t('KeyboardShortcutPrompt.Large Fast Forward'), ['LARGE_FAST_FORWARD']],
    [t('KeyboardShortcutPrompt.Small Rewind'), ['SMALL_REWIND']],
    [t('KeyboardShortcutPrompt.Small Fast Forward'), ['SMALL_FAST_FORWARD']],
    [t('KeyboardShortcutPrompt.Decrease Video Speed'), ['DECREASE_VIDEO_SPEED', 'DECREASE_VIDEO_SPEED_ALT']],
    [t('KeyboardShortcutPrompt.Increase Video Speed'), ['INCREASE_VIDEO_SPEED', 'INCREASE_VIDEO_SPEED_ALT']],
    [t('KeyboardShortcutPrompt.Home'), ['HOME']],
    [t('KeyboardShortcutPrompt.End'), ['END']],
    [t('KeyboardShortcutPrompt.Skip by Tenths'), ['SKIP_N_TENTHS']],
    [t('KeyboardShortcutPrompt.Last Chapter'), ['LAST_CHAPTER']],
    [t('KeyboardShortcutPrompt.Next Chapter'), ['NEXT_CHAPTER']],
    [t('KeyboardShortcutPrompt.Last Frame'), ['LAST_FRAME']],
    [t('KeyboardShortcutPrompt.Next Frame'), ['NEXT_FRAME']],
    [t('KeyboardShortcutPrompt.Skip to Next Video'), ['SKIP_TO_NEXT']],
    [t('KeyboardShortcutPrompt.Skip to Previous Video'), ['SKIP_TO_PREV']],
  ]
})

function hideKeyboardShortcutPrompt() {
  store.dispatch('hideKeyboardShortcutPrompt')
}

function getLocalizedShortcutNamesAndValues(dictionary) {
  const shortcutNameToShortcutsMappings = localizedShortcutNameToShortcutsMappings.value
  const shortcutLabelSeparator = t('shortcutLabelSeparator')

  return shortcutNameToShortcutsMappings
    .filter(([_localizedShortcutName, shortcutCodes]) =>
      shortcutCodes.some(shortcutCode => Object.hasOwn(dictionary, shortcutCode))
    )
    .map(([localizedShortcutName, shortcutCodes]) => {
      const localizedShortcuts = shortcutCodes.map(code => getLocalizedShortcut(dictionary[code]))
      return [localizedShortcutName, localizedShortcuts.join(shortcutLabelSeparator)]
    })
}

</script>

<style scoped src="./FtKeyboardShortcutPrompt.css" />
