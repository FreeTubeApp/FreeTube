<template>
  <FtSettingsSection
    :title="t('Settings.External Downloader Settings.External Downloader Settings')"
  >
    <FtFlexBox class="readmeRow">
      <FtButton
        :label="t('Settings.External Downloader Settings.yt-dlp Readme')"
        :icon="['fas', 'external-link-alt']"
        @click="openYtdlpReadme"
      />
    </FtFlexBox>
    <FtFlexBox class="settingsFlexStart460px pathRow">
      <div class="inputWithCustomLabel">
        <p class="customLabel">
          {{ t('Settings.External Downloader Settings.yt-dlp Executable Path') }}
          <FtTooltip
            class="selectTooltip"
            position="bottom"
            :tooltip="t('Tooltips.External Downloader Settings.yt-dlp Executable Path')"
          />
          <a
            class="downloadLink"
            :aria-label="t('Settings.External Downloader Settings.Download yt-dlp')"
            :title="t('Settings.External Downloader Settings.Download yt-dlp')"
            href="javascript:void(0)"
            @click="openYtdlpReleases"
          >
            <FontAwesomeIcon :icon="['fas', 'download']" />
          </a>
          <span
            v-if="ytdlpVersion"
            class="versionText"
          >{{ ytdlpVersion }}</span>
        </p>
        <FtInput
          :placeholder="t('Settings.External Downloader Settings.yt-dlp Executable Path')"
          :show-action-button="false"
          :show-label="false"
          :value="ytdlpExecutable"
          @input="updateYtdlpExecutable"
        />
      </div>
      <FtButton
        class="folderButton"
        :icon="['fas', 'folder-open']"
        :title="t('Settings.External Downloader Settings.Choose Executable')"
        @click="chooseYtdlpExecutable"
      />
    </FtFlexBox>
    <FtFlexBox class="settingsFlexStart460px pathRow">
      <div class="inputWithCustomLabel">
        <p class="customLabel">
          {{ t('Settings.External Downloader Settings.ffmpeg Executable Path') }}
          <FtTooltip
            class="selectTooltip"
            position="bottom"
            :tooltip="t('Tooltips.External Downloader Settings.ffmpeg Executable Path')"
          />
          <a
            class="downloadLink"
            :aria-label="t('Settings.External Downloader Settings.Download FFmpeg')"
            :title="t('Settings.External Downloader Settings.Download FFmpeg')"
            href="javascript:void(0)"
            @click="openFfmpegReleases"
          >
            <FontAwesomeIcon :icon="['fas', 'download']" />
          </a>
          <span
            v-if="ffmpegVersion"
            class="versionText"
          >{{ ffmpegVersion }}</span>
        </p>
        <FtInput
          :placeholder="t('Settings.External Downloader Settings.ffmpeg Executable Path')"
          :show-action-button="false"
          :show-label="false"
          :value="ffmpegExecutable"
          @input="updateFfmpegExecutable"
        />
      </div>
      <FtButton
        class="folderButton"
        :icon="['fas', 'folder-open']"
        :title="t('Settings.External Downloader Settings.Choose Executable')"
        @click="chooseFfmpegExecutable"
      />
    </FtFlexBox>
    <FtFlexBox class="settingsFlexStart460px pathRow">
      <div class="inputWithCustomLabel">
        <FtInput
          :placeholder="t('Settings.External Downloader Settings.Output Directory')"
          :show-action-button="false"
          :show-label="true"
          :value="ytdlpOutputDirectory"
          :tooltip="t('Tooltips.External Downloader Settings.Output Directory')"
          @input="updateYtdlpOutputDirectory"
        />
      </div>
      <FtButton
        class="folderButton"
        :icon="['fas', 'folder-open']"
        :title="t('Settings.External Downloader Settings.Choose Output Directory')"
        @click="chooseYtdlpOutputDirectory"
      />
    </FtFlexBox>
    <FtFlexBox class="customArgsRow">
      <div class="inputWithCustomLabel">
        <FtInput
          :placeholder="t('Settings.External Downloader Settings.Video - Custom Arguments')"
          :show-action-button="false"
          :show-label="true"
          :value="ytdlpVideoCustomArgs"
          :tooltip="t('Tooltips.External Downloader Settings.Video - Custom Arguments')"
          @input="updateYtdlpVideoCustomArgs"
        />
      </div>
      <div class="inputWithCustomLabel">
        <FtInput
          :placeholder="t('Settings.External Downloader Settings.Audio - Custom Arguments')"
          :show-action-button="false"
          :show-label="true"
          :value="ytdlpAudioCustomArgs"
          :tooltip="t('Tooltips.External Downloader Settings.Audio - Custom Arguments')"
          @input="updateYtdlpAudioCustomArgs"
        />
      </div>
    </FtFlexBox>
  </FtSettingsSection>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtInput from './FtInput/FtInput.vue'
import FtButton from './FtButton/FtButton.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtTooltip from './FtTooltip/FtTooltip.vue'

import store from '../store/index'
import { debounce, openExternalLink } from '../helpers/utils'

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
  debouncedRefreshVersions()
}

async function chooseYtdlpExecutable() {
  if (process.env.IS_ELECTRON) {
    await window.ftElectron.chooseYtdlpExecutable()
    await refreshVersions()
  }
}

/**
 * @param {string} value
 */
function updateFfmpegExecutable(value) {
  store.dispatch('updateFfmpegExecutable', value)
  debouncedRefreshVersions()
}

async function chooseFfmpegExecutable() {
  if (process.env.IS_ELECTRON) {
    await window.ftElectron.chooseFfmpegExecutable()
    await refreshVersions()
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

const ytdlpVersion = ref('')
const ffmpegVersion = ref('')

async function refreshVersions() {
  if (!process.env.IS_ELECTRON) {
    return
  }

  const { ytdlp, ffmpeg } = await window.ftElectron.getDownloaderExecutableVersions()
  ytdlpVersion.value = ytdlp || ''
  ffmpegVersion.value = ffmpeg || ''
}

const debouncedRefreshVersions = debounce(refreshVersions, 500)

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

  const resolvedOutputDirectory = await window.ftElectron.resolveYtdlpOutputDirectory()
  if (resolvedOutputDirectory && resolvedOutputDirectory !== ytdlpOutputDirectory.value) {
    store.dispatch('updateYtdlpOutputDirectory', resolvedOutputDirectory)
  }

  await refreshVersions()
})
</script>

<style scoped>
:deep(.ft-input-component:focus-within),
:deep(.ft-input-component:hover) {
  z-index: 1;
}

.readmeRow {
  justify-content: flex-start;
}

.customArgsRow {
  align-items: flex-start;
  gap: 20px;
}

.pathRow {
  align-items: flex-end;
}

.inputWithCustomLabel {
  flex: 1;
  min-inline-size: 0;
}

.customLabel {
  margin-block: 0 5px;
  margin-inline: 0;
  display: flex;
  align-items: center;
}

.folderButton {
  min-inline-size: 0;
  padding: 12px;
  margin-block-end: 10px;
}

.downloadLink {
  color: var(--primary-text-color);
  margin-inline-start: 8px;
}

.versionText {
  color: var(--tertiary-text-color);
  margin-inline-start: 8px;
  font-size: 0.85em;
}
</style>
