<template>
  <FtSettingsSection
    :title="$t('Settings.Theme Settings.Theme Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Theme Settings.Match Top Bar with Main Color')"
          compact
          :default-value="barColor"
          @change="updateBarColor"
        />
        <FtToggleSwitch
          :label="$t('Settings.Theme Settings.Expand Side Bar by Default')"
          compact
          :default-value="expandSideBar"
          @change="handleExpandSideBar"
        />
        <FtToggleSwitch
          v-if="usingElectron"
          :label="$t('Settings.Theme Settings.Disable Smooth Scrolling')"
          compact
          :default-value="disableSmoothScrollingToggleValue"
          @change="handleRestartPrompt"
        />
      </div>
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Theme Settings.Hide Side Bar Labels')"
          compact
          :default-value="hideLabelsSideBar"
          @change="updateHideLabelsSideBar"
        />
        <FtToggleSwitch
          :label="$t('Settings.Theme Settings.Hide FreeTube Header Logo')"
          compact
          :default-value="hideHeaderLogo"
          @change="updateHideHeaderLogo"
        />
      </div>
    </div>
    <template v-if="usingElectron">
      <FtFlexBox>
        <FtSlider
          :label="$t('Settings.Theme Settings.UI Scale')"
          :default-value="uiScale"
          :min-value="50"
          :max-value="300"
          :step="5"
          value-extension="%"
          @change="updateUiScale"
        />
      </FtFlexBox>
      <br>
    </template>
    <FtFlexBox>
      <FtSelect
        :placeholder="$t('Settings.Theme Settings.Base Theme.Base Theme')"
        :value="baseTheme"
        :select-names="baseThemeNames"
        :select-values="BASE_THEME_VALUES"
        :icon="['fas', 'palette']"
        @change="updateBaseTheme"
      />
      <FtSelect
        :placeholder="$t('Settings.Theme Settings.Main Color Theme.Main Color Theme')"
        :value="mainColor"
        :select-names="colorNames"
        :select-values="COLOR_VALUES"
        :disabled="!areColorThemesEnabled"
        :icon="['fas', 'palette']"
        icon-color="var(--primary-color)"
        @change="updateMainColor"
      />
      <FtSelect
        :placeholder="$t('Settings.Theme Settings.Secondary Color Theme')"
        :value="secColor"
        :select-names="colorNames"
        :select-values="COLOR_VALUES"
        :disabled="!areColorThemesEnabled"
        :icon="['fas', 'palette']"
        icon-color="var(--accent-color)"
        @change="updateSecColor"
      />
    </FtFlexBox>
    <FtPrompt
      v-if="showRestartPrompt"
      :label="$t('Settings[\'The app needs to restart for changes to take effect. Restart and apply change?\']')"
      :option-names="restartPromptNames"
      :option-values="RESTART_PROMPT_VALUES"
      @click="handleSmoothScrolling"
    />
  </FtSettingsSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/use-i18n-polyfill'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtSelect from './FtSelect/FtSelect.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'
import FtSlider from './FtSlider/FtSlider.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtPrompt from './FtPrompt/FtPrompt.vue'

import store from '../store/index'

import { colors } from '../helpers/colors'
import { useColorTranslations } from '../composables/colors'

const { t } = useI18n()

// Themes are devided into 3 groups.
// The first group contains the default themes.
// The second group are themes that don't have specific primary and secondary colors.
// The third group are themes that do have specific primary and secondary colors available.

const BASE_THEME_VALUES = [
  // First group
  'system',
  'light',
  'dark',
  'black',
  // Second group
  'nordic',
  'hotPink',
  'pastelPink',
  // Third group
  'catppuccinFrappe',
  'catppuccinMocha',
  'dracula',
  'everforestDarkHard',
  'everforestDarkMedium',
  'everforestDarkLow',
  'everforestLightHard',
  'everforestLightMedium',
  'everforestLightLow',
  'gruvboxDark',
  'gruvboxLight',
  'solarizedDark',
  'solarizedLight'
]

const baseThemeNames = computed(() => [
  // First group
  t('Settings.Theme Settings.Base Theme.System Default'),
  t('Settings.Theme Settings.Base Theme.Light'),
  t('Settings.Theme Settings.Base Theme.Dark'),
  t('Settings.Theme Settings.Base Theme.Black'),
  // Second group
  t('Settings.Theme Settings.Base Theme.Nordic'),
  t('Settings.Theme Settings.Base Theme.Hot Pink'),
  t('Settings.Theme Settings.Base Theme.Pastel Pink'),
  // Third group
  t('Settings.Theme Settings.Base Theme.Catppuccin Frappe'),
  t('Settings.Theme Settings.Base Theme.Catppuccin Mocha'),
  t('Settings.Theme Settings.Base Theme.Dracula'),
  t('Settings.Theme Settings.Base Theme.Everforest Dark Hard'),
  t('Settings.Theme Settings.Base Theme.Everforest Dark Medium'),
  t('Settings.Theme Settings.Base Theme.Everforest Dark Low'),
  t('Settings.Theme Settings.Base Theme.Everforest Light Hard'),
  t('Settings.Theme Settings.Base Theme.Everforest Light Medium'),
  t('Settings.Theme Settings.Base Theme.Everforest Light Low'),
  t('Settings.Theme Settings.Base Theme.Gruvbox Dark'),
  t('Settings.Theme Settings.Base Theme.Gruvbox Light'),
  t('Settings.Theme Settings.Base Theme.Solarized Dark'),
  t('Settings.Theme Settings.Base Theme.Solarized Light')
])

const COLOR_VALUES = colors.map(color => color.name)
const colorNames = useColorTranslations()

/** @type {import('vue').ComputedRef<boolean>} */
const barColor = computed(() => {
  return store.getters.getBarColor
})

/**
 * @param {boolean} value
 */
function updateBarColor(value) {
  store.dispatch('updateBarColor', value)
}

/** @type {import('vue').ComputedRef<string>} */
const baseTheme = computed(() => {
  return store.getters.getBaseTheme
})

/**
 * @param {string} value
 */
function updateBaseTheme(value) {
  store.dispatch('updateBaseTheme', value)
}

const areColorThemesEnabled = computed(() => baseTheme.value !== 'hotPink')

/** @type {import('vue').ComputedRef<string>} */
const mainColor = computed(() => {
  return store.getters.getMainColor
})

/**
 * @param {string} value
 */
function updateMainColor(value) {
  store.dispatch('updateMainColor', value)
}

/** @type {import('vue').ComputedRef<string>} */
const secColor = computed(() => {
  return store.getters.getSecColor
})

/**
 * @param {string} value
 */
function updateSecColor(value) {
  store.dispatch('updateSecColor', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const expandSideBar = computed(() => {
  return store.getters.getexpandSideBar
})

/** @type {import('vue').ComputedRef<boolean>} */
const isSideNavOpen = computed(() => {
  return store.getters.getIsSideNavOpen
})

/**
 * @param {boolean} value
 */
function handleExpandSideBar(value) {
  if (isSideNavOpen.value !== value) {
    store.commit('toggleSideNav')
  }

  store.dispatch('updateExpandSideBar', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const hideLabelsSideBar = computed(() => {
  return store.getters.getHideLabelsSideBar
})

/**
 * @param {boolean} value
 */
function updateHideLabelsSideBar(value) {
  store.dispatch('updateHideLabelsSideBar', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const hideHeaderLogo = computed(() => {
  return store.getters.getHideHeaderLogo
})

/**
 * @param {boolean} value
 */
function updateHideHeaderLogo(value) {
  store.dispatch('updateHideHeaderLogo', value)
}

/** @type {import('vue').ComputedRef<number>} */
const uiScale = computed(() => store.getters.getUiScale)

/**
 * @param {number} value
 */
function updateUiScale(value) {
  store.dispatch('updateUiScale', value)
}

/** @type {boolean} */
const usingElectron = process.env.IS_ELECTRON

const RESTART_PROMPT_VALUES = [
  'restart',
  'cancel'
]

const restartPromptNames = computed(() => [
  t('Yes, Restart'),
  t('Cancel')
])

/** @type {import('vue').Ref<boolean>} */
const disableSmoothScrollingToggleValue = ref(store.getters.getDisableSmoothScrolling)
const showRestartPrompt = ref(false)

/**
 * @param {boolean} value
 */
function handleRestartPrompt(value) {
  disableSmoothScrollingToggleValue.value = value
  showRestartPrompt.value = true
}

/**
 * @param {'restart' | 'cancel' | null} value
 */
function handleSmoothScrolling(value) {
  showRestartPrompt.value = false

  if (value === null || value === 'cancel') {
    disableSmoothScrollingToggleValue.value = !disableSmoothScrollingToggleValue.value
    return
  }

  if (process.env.IS_ELECTRON) {
    store.dispatch('updateDisableSmoothScrolling',
      disableSmoothScrollingToggleValue.value
    ).then(() => {
      window.ftElectron.relaunch()
    })
  }
}
</script>
