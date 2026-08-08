<template>
  <FtSettingsSection
    :title="t('Settings.External Downloader Settings.External Downloader Settings')"
  >
    <FtFlexBox class="versionsRow">
      <p
        v-if="versionsText"
        class="versionsText"
      >
        {{ versionsText }}
      </p>
      <FtButton
        :label="t('Settings.External Downloader Settings.yt-dlp Readme')"
        :icon="['fas', 'external-link-alt']"
        @click="openYtdlpReadme"
      />
    </FtFlexBox>
    <FtFlexBox class="settingsFlexStart460px">
      <FtInput
        :placeholder="t('Settings.External Downloader Settings.yt-dlp Executable Path')"
        :show-action-button="false"
        :show-label="true"
        :value="ytdlpExecutable"
        :tooltip="t('Tooltips.External Downloader Settings.yt-dlp Executable Path')"
        @input="updateYtdlpExecutable"
      />
      <div class="buttonPair">
        <FtButton
          class="centerButton"
          :label="t('Settings.External Downloader Settings.Choose Executable')"
          @click="chooseYtdlpExecutable"
        />
        <FtButton
          class="centerButton"
          :label="t('Settings.External Downloader Settings.Download yt-dlp')"
          :icon="['fas', 'download']"
          @click="openYtdlpReleases"
        />
      </div>
    </FtFlexBox>
    <FtFlexBox class="settingsFlexStart460px">
      <FtInput
        :placeholder="t('Settings.External Downloader Settings.ffmpeg Executable Path')"
        :show-action-button="false"
        :show-label="true"
        :value="ffmpegExecutable"
        :tooltip="t('Tooltips.External Downloader Settings.ffmpeg Executable Path')"
        @input="updateFfmpegExecutable"
      />
      <div class="buttonPair">
        <FtButton
          class="centerButton"
          :label="t('Settings.External Downloader Settings.Choose Executable')"
          @click="chooseFfmpegExecutable"
        />
        <FtButton
          class="centerButton"
          :label="t('Settings.External Downloader Settings.Download FFmpeg')"
          :icon="['fas', 'download']"
          @click="openFfmpegReleases"
        />
      </div>
    </FtFlexBox>
    <FtFlexBox class="settingsFlexStart460px">
      <FtInput
        :placeholder="t('Settings.External Downloader Settings.Output Directory')"
        :show-action-button="false"
        :show-label="true"
        :value="ytdlpOutputDirectory"
        :tooltip="t('Tooltips.External Downloader Settings.Output Directory')"
        @input="updateYtdlpOutputDirectory"
      />
      <FtButton
        class="centerButton"
        :label="t('Settings.External Downloader Settings.Choose Output Directory')"
        @click="chooseYtdlpOutputDirectory"
      />
    </FtFlexBox>
    <FtFlexBox>
      <FtInput
        :placeholder="t('Settings.External Downloader Settings.Video - Custom Arguments')"
        :show-action-button="false"
        :show-label="true"
        :value="ytdlpVideoCustomArgs"
        :tooltip="t('Tooltips.External Downloader Settings.Video - Custom Arguments')"
        @input="updateYtdlpVideoCustomArgs"
      />
    </FtFlexBox>
    <FtFlexBox>
      <FtInput
        :placeholder="t('Settings.External Downloader Settings.Audio - Custom Arguments')"
        :show-action-button="false"
        :show-label="true"
        :value="ytdlpAudioCustomArgs"
        :tooltip="t('Tooltips.External Downloader Settings.Audio - Custom Arguments')"
        @input="updateYtdlpAudioCustomArgs"
      />
    </FtFlexBox>
  </FtSettingsSection>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtInput from './FtInput/FtInput.vue'
import FtButton from './FtButton/FtButton.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'

import store from '../store/index'
import { openExternalLink } from '../helpers/utils'

const { t } = useI18n()

/** @type {import('vue').ComputedRef<string>} */
const ytdlpExecutable = computed(() => store.getters.getYtdlpExecutable)

/** @type {import('vue').ComputedRef<string>} */
const ffmpegExecutable = computed(() => store.getters.getFfmpegExecutable)

/** @type {import('vue').ComputedRef<string>} */
const ytdlpOutputDirectory = computed(() => store.getters.getYtdlpOutputDirectory)

/** @type {import('vue').ComputedRef<string>} */
const ytdlpVideoCustomArgs = computed(() => store.getters.getYtdlpVideoCustomArgs)

/** @type {import('vue').ComputedRef<string>} */
const ytdlpAudioCustomArgs = computed(() => store.getters.getYtdlpAudioCustomArgs)

/**
 * @param {string} value
 */
function updateYtdlpExecutable(value) {
  store.dispatch('updateYtdlpExecutable', value)
}

function chooseYtdlpExecutable() {
  if (process.env.IS_ELECTRON) {
    window.ftElectron.chooseYtdlpExecutable()
  }
}

/**
 * @param {string} value
 */
function updateFfmpegExecutable(value) {
  store.dispatch('updateFfmpegExecutable', value)
}

function chooseFfmpegExecutable() {
  if (process.env.IS_ELECTRON) {
    window.ftElectron.chooseFfmpegExecutable()
  }
}

function chooseYtdlpOutputDirectory() {
  if (process.env.IS_ELECTRON) {
    window.ftElectron.chooseYtdlpOutputDirectory()
  }
}

/**
 * @param {string} value
 */
function updateYtdlpOutputDirectory(value) {
  store.dispatch('updateYtdlpOutputDirectory', value)
}

/**
 * @param {string} value
 */
function updateYtdlpVideoCustomArgs(value) {
  store.dispatch('updateYtdlpVideoCustomArgs', value)
}

/**
 * @param {string} value
 */
function updateYtdlpAudioCustomArgs(value) {
  store.dispatch('updateYtdlpAudioCustomArgs', value)
}

function openYtdlpReadme() {
  openExternalLink('https://github.com/yt-dlp/yt-dlp#readme')
}

function openYtdlpReleases() {
  openExternalLink('https://github.com/yt-dlp/yt-dlp/releases')
}

function openFfmpegReleases() {
  openExternalLink('https://github.com/yt-dlp/FFmpeg-Builds/releases')
}

const versionsText = ref('')

async function refreshVersions() {
  if (!process.env.IS_ELECTRON) {
    return
  }

  const { ytdlp, ffmpeg } = await window.ftElectron.getDownloaderExecutableVersions()

  const parts = []
  if (ytdlp) {
    parts.push(`yt-dlp ${ytdlp}`)
  }
  if (ffmpeg) {
    parts.push(`ffmpeg ${ffmpeg}`)
  }

  versionsText.value = parts.join(' · ')
}

onMounted(async () => {
  if (!process.env.IS_ELECTRON) {
    return
  }

  const resolvedYtdlp = await window.ftElectron.resolveExecutablePath('yt-dlp', 'ytdlpExecutable')
  if (resolvedYtdlp && resolvedYtdlp !== ytdlpExecutable.value) {
    store.dispatch('updateYtdlpExecutable', resolvedYtdlp)
  }

  const resolvedFfmpeg = await window.ftElectron.resolveExecutablePath('ffmpeg', 'ffmpegExecutable')
  if (resolvedFfmpeg && resolvedFfmpeg !== ffmpegExecutable.value) {
    store.dispatch('updateFfmpegExecutable', resolvedFfmpeg)
  }

  await refreshVersions()
})
</script>

<style scoped>
:deep(.ft-input-component:focus-within),
:deep(.ft-input-component:hover) {
  z-index: 1;
}

.buttonPair {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
}

.versionsRow {
  align-items: center;
}

.versionsText {
  color: var(--tertiary-text-color);
  margin: 0;
}
</style>
