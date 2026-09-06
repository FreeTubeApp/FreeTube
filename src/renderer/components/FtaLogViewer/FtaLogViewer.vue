<template>
  <div v-if="usingAndroid && !usingRelease">
    <FtPrompt
      v-if="shown"
      :label="t('Log Viewer.Console Log')"
      :inert="hidden"
      :fullscreen="true"
      @click="hideLogViewer"
    >
      <div
        class="logs-wrapper"
        :data-theme="theme"
      >
        <div class="logs">
          <div
            v-for="log in logsReversed"
            :key="log.key"
            :class="log.level.toLowerCase()"
          >
            <FontAwesomeIcon
              v-if="getFaIconFromLevel(log.level) !== null"
              class="level"
              :icon="['fas', getFaIconFromLevel(log.level)]"
            />
            <!-- eslint-disable vue/no-v-html -->
            <span
              class="content"
              v-html="log.content"
            />
            <!-- eslint-enable vue/no-v-html -->
            <span class="source">{{ `${removeQueryString(log.sourceId)}:${log.lineNumber}` }}</span>
            <span class="timestamp">{{ new Date(log.timestamp).toISOString() }}</span>
          </div>
        </div>
        <div class="actions-container">
          <FtFlexBox>
            <FtButton
              :label="t('Close')"
              :text-color="null"
              :background-color="null"
              @click="hideLogViewer"
            />
          </FtFlexBox>
        </div>
      </div>
    </FtPrompt>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import store from '../../store/index'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
import FtButton from '../FtButton/FtButton.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { isColourDark } from '../../helpers/android/utils'
import { getConsoleLogs } from '../../helpers/android/system'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  logLimit
} = defineProps({
  logLimit: {
    type: Number,
    default: 50
  }
})

function getThemeFromBody() {
  const bodyStyle = getComputedStyle(document.body)
  const text = bodyStyle.getPropertyValue('--primary-text-color')
  const isDark = isColourDark(text)
  return isDark ? 'dark' : 'light'
}

function getFaIconFromLevel(level) {
  switch (level) {
    case 'WARNING':
      return 'triangle-exclamation'
    case 'ERROR':
      return 'circle-xmark'
    default:
      return null
  }
}

function removeQueryString(path) {
  if (path.indexOf('?') !== -1) {
    return path.split('?')[0]
  } else {
    return path
  }
}

function onLightModeEnabled() {
  if (store.getters.getBaseTheme === 'system') {
    theme.value = 'light'
  }
}

function onDarkModeEnabled() {
  if (store.getters.getBaseTheme === 'system') {
    theme.value = 'dark'
  }
}

function onConsoleMessage({ data }) {
  if ('content' in data && data.content !== null) {
    if (data.content.indexOf('found in') === -1 && data.content.indexOf('---> <FtaLogViewer>') === -1) {
      // don't show errors related to the log viewer (creates infinite loop)
      if (!logs.value.some(log => log.key === data.key)) {
        if (logs.value.length > logLimit) {
          logs.value = logs.value.slice(logs.value.length - logLimit)
        }
        data.content = data.content
          // sanitise html
          .replaceAll('&', '&amp;')
          .replaceAll('/', '&#47;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          // format text line breaks and tabs into html (for youtube.js errors)
          .replaceAll('\n', '<br/>')
          .replaceAll('\t', '&nbsp;&nbsp;')
          .replaceAll('  ', '&nbsp;&nbsp;')
        logs.value.push(data)
      }
    }
  }
}

function hideLogViewer() {
  store.dispatch('hideLogViewer')
}

const usingAndroid = process.env.IS_ANDROID
const usingRelease = process.env.IS_RELEASE
const theme = ref(getThemeFromBody())
const logs = ref([])

const baseTheme = computed(function () {
  return store.getters.getBaseTheme
})

watch(baseTheme, () => {
  theme.value = getThemeFromBody()
})

const logsReversed = computed(function () {
  const result = []
  for (let i = logs.value.length - 1; i >= 0; i--) {
    result.push(logs.value[i])
  }
  return result
})

const shown = computed(() => {
  return store.getters.getShowLogViewer
})

const hidden = computed(() => {
  return !store.getters.getShowLogViewer
})

onMounted(() => {
  if (usingAndroid) {
    window.addEventListener('enabled-light-mode', onLightModeEnabled)
    window.addEventListener('enabled-dark-mode', onDarkModeEnabled)
    // when mounted, backfill the logs so far
    logs.value.push(...getConsoleLogs())
    window.addEventListener('console-message', onConsoleMessage)
  }
})

onBeforeUnmount(() => {
  if (usingAndroid) {
    window.removeEventListener('enabled-light-mode', onLightModeEnabled)
    window.removeEventListener('enabled-dark-mode', onDarkModeEnabled)
    window.removeEventListener('console-message', onConsoleMessage)
  }
})

</script>
<style scoped src="./FtaLogViewer.css" />
