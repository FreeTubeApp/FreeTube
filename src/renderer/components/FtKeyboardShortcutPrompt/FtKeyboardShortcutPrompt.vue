<template>
  <FtPrompt
    :label="title"
    @click="hideKeyboardShortcutPrompt"
  >
    <div class="titleAndCloseButton">
      <h2>
        {{ title }}
      </h2>
      <FtIconButton
        :title="closeButtonTitle"
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
        v-for="primarySection of primarySections"
        :key="primarySection.title"
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
// import { KeyboardShortcuts } from '../../constants'
// import { getLocalizedShortcut } from '../../store/modules/utils'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import store from '../../store/index'
import i18n from '../../i18n/index'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'


// temp
const KeyboardShortcuts = {
  APP: {
    GENERAL: {
      HISTORY_BACKWARD: 'alt+arrowleft',
      HISTORY_FORWARD: 'alt+arrowright',
      FULLSCREEN: 'f11',
      NAVIGATE_TO_SETTINGS: 'ctrl+,',
      NAVIGATE_TO_HISTORY: 'ctrl+H',
      NAVIGATE_TO_HISTORY_MAC: 'cmd+Y',
      NEW_WINDOW: 'ctrl+N',
      MINIMIZE_WINDOW: 'ctrl+M',
      CLOSE_WINDOW: 'ctrl+W',
      QUIT: 'alt+f4',
      QUIT_MAC: 'cmd+Q',
      RELOAD: 'ctrl+R',
      FORCE_RELOAD: 'ctrl+shift+R',
      TOGGLE_DEVTOOLS: 'ctrl+shift+I',
      FOCUS_SEARCH: 'alt+D',
      SEARCH_IN_NEW_WINDOW: 'shift+enter',
      RESET_ZOOM: 'ctrl+0',
      ZOOM_IN: 'ctrl+=',
      ZOOM_OUT: 'ctrl+-'

    },
    SITUATIONAL: {
      REFRESH: 'r',
      FOCUS_SECONDARY_SEARCH: 'ctrl+F'
    },
  },
  VIDEO_PLAYER: {
    GENERAL: {
      CAPTIONS: 'c',
      THEATRE_MODE: 't',
      FULLSCREEN: 'f',
      FULLWINDOW: 's',
      PICTURE_IN_PICTURE: 'i',
      MUTE: 'm',
      VOLUME_UP: 'arrowup',
      VOLUME_DOWN: 'arrowdown',
      STATS: 'd',
      TAKE_SCREENSHOT: 'u',
    },
    PLAYBACK: {
      PLAY: 'k',
      LARGE_REWIND: 'j',
      LARGE_FAST_FORWARD: 'l',
      SMALL_REWIND: 'arrowleft',
      SMALL_FAST_FORWARD: 'arrowright',
      DECREASE_VIDEO_SPEED: 'o',
      INCREASE_VIDEO_SPEED: 'p',
      SKIP_N_TENTHS: '0..9',
      LAST_CHAPTER: 'ctrl+arrowleft',
      NEXT_CHAPTER: 'ctrl+arrowright',
      LAST_FRAME: ',',
      NEXT_FRAME: '.',
    }
  },
}

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
        title: i18n.t('KeyboardShortcutPrompt.Sections.Video.Playback'),
        shortcutDictionary: playbackPlayerShortcuts.value
      },
      {
        title: i18n.t('KeyboardShortcutPrompt.Sections.Video.General'),
        shortcutDictionary: generalPlayerShortcuts.value
      },
    ]
  },
  {
    secondarySections: [
      {
        title: i18n.t('KeyboardShortcutPrompt.Sections.App.General'),
        shortcutDictionary: generalAppShortcuts.value
      },
      {
        title: i18n.t('KeyboardShortcutPrompt.Sections.App.Situational'),
        shortcutDictionary: situationalAppShortcuts.value
      }
    ]
  }
])

const isMac = process.platform === 'darwin'

const title = computed(() => i18n.t('KeyboardShortcutPrompt.Keyboard Shortcuts'))

const closeButtonTitle = computed(() => i18n.t('Close'))

const localizedShortcutNameDictionary = computed(() => {
  return new Map([
    ['HISTORY_BACKWARD', i18n.t('KeyboardShortcutPrompt.History Backward')],
    ['HISTORY_FORWARD', i18n.t('KeyboardShortcutPrompt.History Forward')],
    ['FULLSCREEN', i18n.t('KeyboardShortcutPrompt.Fullscreen')],
    ['NAVIGATE_TO_SETTINGS', i18n.t('KeyboardShortcutPrompt.Navigate to Settings')],
    (
      isMac
      ? ['NAVIGATE_TO_HISTORY_MAC', i18n.t('KeyboardShortcutPrompt.Navigate to History')]
      : ['NAVIGATE_TO_HISTORY', i18n.t('KeyboardShortcutPrompt.Navigate to History')]
    ),
    ['NEW_WINDOW', i18n.t('KeyboardShortcutPrompt.New Window')],
    ['MINIMIZE_WINDOW', i18n.t('KeyboardShortcutPrompt.Minimize Window')],
    ['CLOSE_WINDOW', i18n.t('KeyboardShortcutPrompt.Close Window')],
    (isMac
      ? ['QUIT', i18n.t('KeyboardShortcutPrompt.Quit')]
      : ['QUIT_MAC', i18n.t('KeyboardShortcutPrompt.Quit')]
    ),
    ['RELOAD', i18n.t('KeyboardShortcutPrompt.Reload')],
    ['FORCE_RELOAD', i18n.t('KeyboardShortcutPrompt.Force Reload')],
    ['TOGGLE_DEVTOOLS', i18n.t('KeyboardShortcutPrompt.Toggle Developer Tools')],
    ['RESET_ZOOM', i18n.t('KeyboardShortcutPrompt.Reset Zoom')],
    ['ZOOM_IN', i18n.t('KeyboardShortcutPrompt.Zoom In')],
    ['ZOOM_OUT', i18n.t('KeyboardShortcutPrompt.Zoom Out')],
    ['FOCUS_SEARCH', i18n.t('KeyboardShortcutPrompt.Focus Search')],
    ['SEARCH_IN_NEW_WINDOW', i18n.t('KeyboardShortcutPrompt.Search in New Window')],

    ['REFRESH', i18n.t('KeyboardShortcutPrompt.Refresh')],
    ['FOCUS_SECONDARY_SEARCH', i18n.t('KeyboardShortcutPrompt.Focus Secondary Search')],

    ['CAPTIONS', i18n.t('KeyboardShortcutPrompt.Captions')],
    ['THEATRE_MODE', i18n.t('KeyboardShortcutPrompt.Theatre Mode')],
    ['FULLSCREEN', i18n.t('KeyboardShortcutPrompt.Fullscreen')],
    ['FULLWINDOW', i18n.t('KeyboardShortcutPrompt.Full Window')],
    ['PICTURE_IN_PICTURE', i18n.t('KeyboardShortcutPrompt.Picture in Picture')],
    ['MUTE', i18n.t('KeyboardShortcutPrompt.Mute')],
    ['VOLUME_UP', i18n.t('KeyboardShortcutPrompt.Volume Up')],
    ['VOLUME_DOWN', i18n.t('KeyboardShortcutPrompt.Volume Down')],
    ['TAKE_SCREENSHOT', i18n.t('KeyboardShortcutPrompt.Take Screenshot')],
    ['STATS', i18n.t('KeyboardShortcutPrompt.Stats')],

    ['PLAY', i18n.t('KeyboardShortcutPrompt.Play')],
    ['LARGE_REWIND', i18n.t('KeyboardShortcutPrompt.Large Rewind')],
    ['LARGE_FAST_FORWARD', i18n.t('KeyboardShortcutPrompt.Large Fast Forward')],
    ['SMALL_REWIND', i18n.t('KeyboardShortcutPrompt.Small Rewind')],
    ['SMALL_FAST_FORWARD', i18n.t('KeyboardShortcutPrompt.Small Fast Forward')],
    ['DECREASE_VIDEO_SPEED', i18n.t('KeyboardShortcutPrompt.Decrease Video Speed')],
    ['INCREASE_VIDEO_SPEED', i18n.t('KeyboardShortcutPrompt.Increase Video Speed')],
    ['SKIP_N_TENTHS', i18n.t('KeyboardShortcutPrompt.Skip by Tenths')],
    ['LAST_CHAPTER', i18n.t('KeyboardShortcutPrompt.Last Chapter')],
    ['NEXT_CHAPTER', i18n.t('KeyboardShortcutPrompt.Next Chapter')],
    ['LAST_FRAME', i18n.t('KeyboardShortcutPrompt.Last Frame')],
    ['NEXT_FRAME', i18n.t('KeyboardShortcutPrompt.Next Frame')],
  ])
})

function hideKeyboardShortcutPrompt() {
  store.dispatch('hideKeyboardShortcutPrompt')
}

function getLocalizedShortcutNamesAndValues(dictionary) {
  return Object.entries(dictionary)
    .filter(([key]) => 
      localizedShortcutNameDictionary.value.has(key)
    )
    .map(([shortcutNameKey, shortcut]) => {
      const localizedShortcutName = localizedShortcutNameDictionary.value.get(shortcutNameKey)
      const localizedShortcut = getLocalizedShortcut(shortcut)
      return [localizedShortcutName, localizedShortcut]
    })
}

function getLocalizedShortcut(x) {
  return x
}

</script>

<style scoped src="./FtKeyboardShortcutPrompt.css" />
