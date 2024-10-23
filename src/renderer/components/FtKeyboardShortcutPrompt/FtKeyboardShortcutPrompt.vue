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
              <label
                :for="label + shortcut"
                class="label"
              >{{ label }}</label>
              <FtInput
                :id="label + shortcut"
                input-type="text"
                class="shortcut"
                :value="shortcut"
                :disabled="true"
                placeholder=""
                :show-action-button="false"
              />
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
import FtInput from '../ft-input/ft-input.vue'
import i18n from '../../i18n/index'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'


// temp
const KeyboardShortcuts = {
  APP: {
    GENERAL: {
      HISTORY_BACKWARD: 'alt+arrowleft',
      HISTORY_FORWARD: 'alt+arrowright',
      NEW_WINDOW: 'ctrl+N',
      NAVIGATE_TO_SETTINGS: 'ctrl+,',
      NAVIGATE_TO_HISTORY: 'ctrl+H',
      NAVIGATE_TO_HISTORY_MAC: 'cmd+Y',
    },
    SITUATIONAL: {
      REFRESH: 'r'
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
      LAST_FRAME: ',',
      NEXT_FRAME: '.',
      LAST_CHAPTER: 'ctrl+arrowleft',
      NEXT_CHAPTER: 'ctrl+arrowright',
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
        title: i18n.t('KeyboardShortcutPrompt.Sections.Video.General'),
        shortcutDictionary: generalPlayerShortcuts.value
      },
      {
        title: i18n.t('KeyboardShortcutPrompt.Sections.Video.Playback'),
        shortcutDictionary: playbackPlayerShortcuts.value
      }
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
    ['NEW_WINDOW', i18n.t('KeyboardShortcutPrompt.New Window')],
    ['NAVIGATE_TO_SETTINGS', i18n.t('KeyboardShortcutPrompt.Navigate to Settings')],
    (
      isMac
      ? ['NAVIGATE_TO_HISTORY_MAC', i18n.t('KeyboardShortcutPrompt.Navigate to History')]
      : ['NAVIGATE_TO_HISTORY', i18n.t('KeyboardShortcutPrompt.Navigate to History')]
    ),
    ['REFRESH', i18n.t('KeyboardShortcutPrompt.Refresh')],

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
    ['LAST_FRAME', i18n.t('KeyboardShortcutPrompt.Last Frame')],
    ['NEXT_FRAME', i18n.t('KeyboardShortcutPrompt.Next Frame')],
    ['LAST_CHAPTER', i18n.t('KeyboardShortcutPrompt.Last Chapter')],
    ['NEXT_CHAPTER', i18n.t('KeyboardShortcutPrompt.Next Chapter')]
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
