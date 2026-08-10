<template>
  <FtSettingsSection
    :title="t('Settings.External Downloader Settings.External Downloader Settings')"
  >
    <FtFlexBox class="topRow">
      <FtToggleSwitch
        :label="t('Settings.External Downloader Settings.Enable Downloads')"
        :compact="true"
        :default-value="downloadEnabled"
        @change="updateDownloadEnabled"
      />
      <FtButton
        :label="t('Settings.External Downloader Settings.yt-dlp Readme')"
        :icon="['fas', 'external-link-alt']"
        @click="openYtdlpReadme"
      />
    </FtFlexBox>
    <template v-if="downloadEnabled">
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
      <FtFlexBox class="customArgsRow">
        <div class="modeSelectWrapper">
          <FtSelect
            :placeholder="t('Settings.External Downloader Settings.Output Directory Mode')"
            :value="downloadMode"
            :select-names="downloadModeNames"
            :select-values="downloadModeValues"
            :icon="['fas', 'folder-open']"
            :tooltip="t('Tooltips.External Downloader Settings.Output Directory Mode')"
            @change="updateDownloadMode"
          />
        </div>
        <div
          v-if="downloadMode === 'default_folder'"
          class="inputWithCustomLabel outputDirectoryField"
        >
          <FtInput
            :placeholder="t('Settings.External Downloader Settings.Output Directory')"
            :show-action-button="false"
            :show-label="true"
            :value="ytdlpOutputDirectory"
            :tooltip="t('Tooltips.External Downloader Settings.Output Directory')"
            @input="updateYtdlpOutputDirectory"
          />
          <FtButton
            class="folderButton"
            :icon="['fas', 'folder-open']"
            :title="t('Settings.External Downloader Settings.Choose Output Directory')"
            @click="chooseYtdlpOutputDirectory"
          />
        </div>
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
    </template>
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
import FtSelect from './FtSelect/FtSelect.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'
import FtTooltip from './FtTooltip/FtTooltip.vue'

import store from '../store/index'
import { debounce, openExternalLink } from '../helpers/utils'

const { t } = useI18n()

/** @type {import('vue').ComputedRef<boolean>} */
const downloadEnabled = computed(() => store.getters.getYtdlpDownloadEnabled)

/** @type {import('vue').ComputedRef<string>} */
const ytdlpExecutable = computed(() => store.getters.getYtdlpExecutable)

/** @type {import('vue').ComputedRef<string>} */
const ytdlpOutputDirectory = computed(() => store.getters.getYtdlpOutputDirectory)

/** @type {import('vue').ComputedRef<string>} */
const ytdlpVideoCustomArgs = computed(() => store.getters.getYtdlpVideoCustomArgs)

/** @type {import('vue').ComputedRef<string>} */
const ytdlpAudioCustomArgs = computed(() => store.getters.getYtdlpAudioCustomArgs)

/**
 * @param {boolean} value
 */
function updateDownloadEnabled(value) {
  store.dispatch('updateYtdlpDownloadEnabled', value)
}

const downloadModeNames = computed(() => [
  t('Settings.External Downloader Settings.Output Directory Modes.Ask Path'),
  t('Settings.External Downloader Settings.Output Directory Modes.Save To Folder'),
])
const downloadModeValues = computed(() => ['prompt_folder', 'default_folder'])

/** @type {import('vue').ComputedRef<'prompt_folder' | 'default_folder'>} */
const downloadMode = computed(() => store.getters.getYtdlpDownloadMode)

/**
 * @param {'prompt_folder' | 'default_folder'} value
 */
function updateDownloadMode(value) {
  store.dispatch('updateYtdlpDownloadMode', value)
}

/**
 * @param {string} value
 */
async function updateYtdlpExecutable(value) {
  store.dispatch('updateYtdlpExecutable', value)
  await debouncedRefreshVersion()
}

async function chooseYtdlpExecutable() {
  if (process.env.IS_ELECTRON) {
    const chosenPath = await window.ftElectron.chooseYtdlpExecutable()
    if (chosenPath) {
      store.dispatch('updateYtdlpExecutable', chosenPath)
    }
    await refreshVersion()
  }
}

async function chooseYtdlpOutputDirectory() {
  if (process.env.IS_ELECTRON) {
    const chosenPath = await window.ftElectron.chooseYtdlpOutputDirectory()
    if (chosenPath) {
      store.dispatch('updateYtdlpOutputDirectory', chosenPath)
    }
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

const ytdlpVersion = ref('')

async function refreshVersion() {
  if (!process.env.IS_ELECTRON) {
    return
  }

  const { ytdlp } = await window.ftElectron.getDownloaderExecutableVersions()
  ytdlpVersion.value = ytdlp || ''
}

const debouncedRefreshVersion = debounce(refreshVersion, 500)

onMounted(async () => {
  if (!process.env.IS_ELECTRON) {
    return
  }

  const resolvedYtdlp = await window.ftElectron.resolveExecutablePath('yt-dlp', 'ytdlpExecutable')
  if (resolvedYtdlp && resolvedYtdlp !== ytdlpExecutable.value) {
    store.dispatch('updateYtdlpExecutable', resolvedYtdlp)
  }

  await refreshVersion()
})
</script>

<style scoped>
:deep(.ft-input-component:focus-within),
:deep(.ft-input-component:hover) {
  z-index: 1;
}

.topRow {
  justify-content: space-between;
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

.modeSelectWrapper {
  padding-block-start: 24px;
}

.modeSelectWrapper :deep(.select) {
  margin-block-start: 0;
}

.outputDirectoryField {
  display: flex;
  flex: 1;
  align-items: flex-end;
  gap: 10px;
  padding-block-start: 5px;
}

.outputDirectoryField :deep(.ft-input-component) {
  flex: 1;
  min-inline-size: 0;
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
