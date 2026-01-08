<template>
  <div
    v-if="dataReady"
    class="app"
    :class="{
      hideOutlines: outlinesHidden,
      isLocaleRightToLeft: isLocaleRightToLeft,
      isSideNavOpen: isSideNavOpen,
      hideLabelsSideBar: hideLabelsSideBar && !isSideNavOpen
    }"
  >
    <TopNav
      :inert="isAnyPromptOpen"
    />
    <SideNav
      :inert="isAnyPromptOpen"
    />
    <FtFlexBox
      class="flexBox routerView"
      role="main"
      :inert="isAnyPromptOpen"
    >
      <div
        v-if="showUpdatesBanner || showBlogBanner"
        class="banner-wrapper"
      >
        <FtNotificationBanner
          v-if="showUpdatesBanner"
          class="banner"
          :message="updateBannerMessage"
          role="link"
          @click="handleUpdateBannerClick"
        />
        <FtNotificationBanner
          v-if="showBlogBanner"
          class="banner"
          :message="blogBannerMessage"
          role="link"
          @click="handleNewBlogBannerClick"
        />
      </div>
      <RouterView
        v-slot="{ Component }"
        class="routerView"
      >
        <Transition
          mode="out-in"
          name="fade"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </FtFlexBox>
    <FtPrompt
      v-if="showReleaseNotes"
      theme="readable-width"
      @click="toggleShowReleaseNotes"
    >
      <template #label="{ labelId }">
        <h1
          :id="labelId"
          class="changeLogTitle"
          dir="ltr"
        >
          {{ changeLogTitle }}
        </h1>
      </template>
      <bdo
        class="changeLogText"
        dir="ltr"
        lang="en"
        v-html="updateChangelog"
      />
      <FtFlexBox>
        <FtButton
          :label="t('Download From Site')"
          @click="openDownloadsPage"
        />
        <FtButton
          :label="t('Close')"
          :text-color="null"
          :background-color="null"
          @click="toggleShowReleaseNotes"
        />
      </FtFlexBox>
    </FtPrompt>
    <FtPrompt
      v-if="showExternalLinkOpeningPrompt"
      :label="t('Are you sure you want to open this link?')"
      :extra-labels="[lastExternalLinkToBeOpened]"
      :option-names="externalLinkOpeningPromptNames"
      :option-values="EXTERNAL_LINK_OPENING_PROMPT_VALUES"
      @click="handleExternalLinkOpeningPromptAnswer"
    />
    <FtSearchFilters
      v-if="showSearchFilters"
    />
    <FtKeyboardShortcutPrompt
      v-if="isKeyboardShortcutPromptShown"
    />
    <FtPlaylistAddVideoPrompt
      v-if="showAddToPlaylistPrompt"
    />
    <FtCreatePlaylistPrompt
      v-if="showCreatePlaylistPrompt"
    />
    <FtToast />
    <FtProgressBar
      v-if="showProgressBar"
    />
  </div>
</template>

<script setup>
import { marked } from 'marked'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from './composables/use-i18n-polyfill'
import { useRoute, useRouter } from 'vue-router'

import FtFlexBox from './components/ft-flex-box/ft-flex-box.vue'
import TopNav from './components/TopNav/TopNav.vue'
import SideNav from './components/SideNav/SideNav.vue'
import FtNotificationBanner from './components/FtNotificationBanner/FtNotificationBanner.vue'
import FtPrompt from './components/FtPrompt/FtPrompt.vue'
import FtButton from './components/FtButton/FtButton.vue'
import FtToast from './components/FtToast/FtToast.vue'
import FtProgressBar from './components/FtProgressBar/FtProgressBar.vue'
import FtPlaylistAddVideoPrompt from './components/FtPlaylistAddVideoPrompt/FtPlaylistAddVideoPrompt.vue'
import FtCreatePlaylistPrompt from './components/FtCreatePlaylistPrompt/FtCreatePlaylistPrompt.vue'
import FtKeyboardShortcutPrompt from './components/FtKeyboardShortcutPrompt/FtKeyboardShortcutPrompt.vue'
import FtSearchFilters from './components/FtSearchFilters/FtSearchFilters.vue'

import store from './store/index'

import packageDetails from '../../package.json'
import { openExternalLink, openInternalPath, showToast } from './helpers/utils'
import { translateWindowTitle } from './helpers/strings'
import { loadLocale } from './i18n/index'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()

/** @type {import('vue').ComputedRef<boolean>} */
const isSideNavOpen = computed(() => store.getters.getIsSideNavOpen)

/** @type {import('vue').ComputedRef<boolean>} */
const hideLabelsSideBar = computed(() => store.getters.getHideLabelsSideBar)

/** @type {import('vue').ComputedRef<boolean>} */
const isAnyPromptOpen = computed(() => store.getters.isAnyPromptOpen)

/** @type {import('vue').ComputedRef<boolean>} */
const showSearchFilters = computed(() => store.getters.getShowSearchFilters)

/** @type {import('vue').ComputedRef<boolean>} */
const isKeyboardShortcutPromptShown = computed(() => store.getters.getIsKeyboardShortcutPromptShown)

/** @type {import('vue').ComputedRef<boolean>} */
const showAddToPlaylistPrompt = computed(() => store.getters.getShowAddToPlaylistPrompt)

/** @type {import('vue').ComputedRef<boolean>} */
const showCreatePlaylistPrompt = computed(() => store.getters.getShowCreatePlaylistPrompt)

/** @type {import('vue').ComputedRef<boolean>} */
const showProgressBar = computed(() => store.getters.getShowProgressBar)

const landingPage = computed(() => '/' + store.getters.getLandingPage)

/** @type {import('vue').ComputedRef<string>} */
const defaultInvidiousInstance = computed(() => store.getters.getDefaultInvidiousInstance)

const dataReady = ref(false)

onMounted(async () => {
  await store.dispatch('grabUserSettings')

  updateTheme()

  await store.dispatch('fetchInvidiousInstancesFromFile')
  if (defaultInvidiousInstance.value === '') {
    await store.dispatch('setRandomCurrentInvidiousInstance')
  }

  store.dispatch('fetchInvidiousInstances').then(() => {
    if (defaultInvidiousInstance.value === '') {
      store.dispatch('setRandomCurrentInvidiousInstance')
    }
  })

  store.dispatch('grabAllProfiles', t('Profile.All Channels')).then(() => {
    store.dispatch('grabHistory')
    store.dispatch('grabAllPlaylists')
    store.dispatch('grabAllSubscriptions')
    store.dispatch('grabSearchHistoryEntries')

    if (process.env.IS_ELECTRON) {
      store.dispatch('setupListenersToSyncWindows')
      document.addEventListener('click', handleClick)
      document.addEventListener('auxclick', handleAuxClick)
      enableOpenUrl()
      store.dispatch('getExternalPlayerCmdArgumentsData')
    }

    dataReady.value = true

    setTimeout(() => {
      checkForNewUpdates()
      checkForNewBlogPosts()
    }, 500)
  })

  if (route.path === '/') {
    router.replace({ path: landingPage.value })
  }

  setWindowTitle()

  document.addEventListener('keydown', handleKeyboardShortcuts)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('dragstart', handleDragStart)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
  document.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('dragstart', handleDragStart)
  document.removeEventListener('click', handleClick)
  document.removeEventListener('auxclick', handleAuxClick)
})

/** @type {import('vue').ComputedRef<string>} */
const baseTheme = computed(() => store.getters.getBaseTheme)

watch(baseTheme, updateTheme)

/** @type {import('vue').ComputedRef<string>} */
const mainColor = computed(() => store.getters.getMainColor)

watch(mainColor, updateTheme)

/** @type {import('vue').ComputedRef<string>} */
const secColor = computed(() => store.getters.getSecColor)

watch(secColor, updateTheme)

function updateTheme() {
  document.body.className = `${baseTheme.value || 'system'} main${mainColor.value || 'Red'} sec${secColor.value || 'Blue'}`
  document.body.dataset.systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

updateTheme()

const showUpdatesBanner = ref(false)
const latestVersionNumber = ref('')
const showReleaseNotes = ref(false)
const changeLogTitle = ref('')
const updateChangelog = ref('')

/** @type {import('vue').ComputedRef<boolean>} */
const checkForUpdates = computed(() => store.getters.getCheckForUpdates)

const updateBannerMessage = computed(() => {
  return t('Version {versionNumber} is now available!  Click for more details', {
    versionNumber: latestVersionNumber.value
  })
})

async function checkForNewUpdates() {
  if (!checkForUpdates.value) {
    return
  }

  try {
    const response = await fetch('https://api.github.com/repos/freetubeapp/freetube/releases?per_page=1')
    const json = await response.json()

    const tagName = json[0].tag_name
    const versionNumber = tagName.replace('v', '').replace('-beta', '')

    let changelog = json[0].body
      // Link usernames to their GitHub profiles
      .replaceAll(/@(\S+)\b/g, '[@$1](https://github.com/$1)')
      // Shorten pull request links to #1234
      .replaceAll(/https:\/\/github\.com\/FreeTubeApp\/FreeTube\/pull\/(\d+)/g, '[#$1]($&)')

    // Add the title
    changelog = `${changelog}`

    updateChangelog.value = marked.parse(changelog)
    changeLogTitle.value = json[0].name
    latestVersionNumber.value = versionNumber

    const appVersion = packageDetails.version.split('.')
    const latestVersion = versionNumber.split('.')

    if (parseInt(appVersion[0]) < parseInt(latestVersion[0])) {
      showUpdatesBanner.value = true
    } else if (parseInt(appVersion[1]) < parseInt(latestVersion[1])) {
      showUpdatesBanner.value = true
    } else if (parseInt(appVersion[2]) < parseInt(latestVersion[2]) && parseInt(appVersion[1]) <= parseInt(latestVersion[1])) {
      showUpdatesBanner.value = true
    }
  } catch (error) {
    console.error('errored while checking for updates', 'https://api.github.com/repos/freetubeapp/freetube/releases?per_page=1', error)
  }
}

function toggleShowReleaseNotes() {
  showReleaseNotes.value = !showReleaseNotes.value
}

/**
 * @param {boolean} response
 */
function handleUpdateBannerClick(response) {
  if (response) {
    showReleaseNotes.value = true
  } else {
    showUpdatesBanner.value = false
  }
}

function openDownloadsPage() {
  openExternalLink('https://freetubeapp.io#download')
  showReleaseNotes.value = false
  showUpdatesBanner.value = false
}

const showBlogBanner = ref(false)
const latestBlogTitle = ref('')
const latestBlogUrl = ref('')

const blogBannerMessage = computed(() => {
  return t('A new blog is now available, {blogTitle}. Click to view more', { blogTitle: latestBlogTitle.value })
})

/** @type {import('vue').ComputedRef<boolean>} */
const checkForBlogPosts = computed(() => store.getters.getCheckForBlogPosts)

async function checkForNewBlogPosts() {
  if (!checkForBlogPosts.value) {
    return
  }

  let lastAppWasRunning = localStorage.getItem('lastAppWasRunning')

  if (lastAppWasRunning !== null) {
    lastAppWasRunning = new Date(lastAppWasRunning)
  }

  const response = await fetch('https://write.as/freetube/feed/')
  const text = await response.text()
  const xmlDom = new DOMParser().parseFromString(text, 'application/xml')

  const latestBlog = xmlDom.querySelector('item')
  const latestPubDate = new Date(latestBlog.querySelector('pubDate').textContent)

  if (lastAppWasRunning === null || latestPubDate > lastAppWasRunning) {
    latestBlogTitle.value = latestBlog.querySelector('title').textContent
    latestBlogUrl.value = latestBlog.querySelector('link').textContent
    showBlogBanner.value = true
  }

  localStorage.setItem('lastAppWasRunning', new Date())
}

/**
 * @param {boolean} response
 */
function handleNewBlogBannerClick(response) {
  if (response) {
    openExternalLink(latestBlogUrl.value)
  }

  showBlogBanner.value = false
}

/** @type {import('vue').ComputedRef<boolean>} */
const outlinesHidden = computed(() => store.getters.getOutlinesHidden)

/**
 * @param {KeyboardEvent} event
 */
function handleKeyboardShortcuts(event) {
  // ignore user typing in HTML `input` elements
  if (event.shiftKey && event.key === '?' && event.target.tagName !== 'INPUT') {
    store.commit('setIsKeyboardShortcutPromptShown', !isKeyboardShortcutPromptShown.value)
  }

  if (event.key === 'Tab') {
    store.dispatch('showOutlines')
  }
}

function handleMouseDown() {
  store.dispatch('hideOutlines')
}

const lastExternalLinkToBeOpened = ref('')
const showExternalLinkOpeningPrompt = ref(false)
const EXTERNAL_LINK_OPENING_PROMPT_VALUES = ['yes', 'no']

const externalLinkOpeningPromptNames = computed(() => [
  t('Yes, Open Link'),
  t('No')
])

/** @type {import('vue').ComputedRef<'' | 'openLinkAfterPrompt' | 'doNothing'>} */
const externalLinkHandling = computed(() => store.getters.getExternalLinkHandling)

/**
 * @param {'yes' | 'no' | null} option
 */
function handleExternalLinkOpeningPromptAnswer(option) {
  showExternalLinkOpeningPrompt.value = false

  if (option === 'yes' && lastExternalLinkToBeOpened.value.length > 0) {
    // Maybe user should be notified
    // if `lastExternalLinkToBeOpened` is empty

    // Open links externally
    openExternalLink(lastExternalLinkToBeOpened.value)
  }
}

/**
 * @param {PointerEvent} event
 */
function isExternalLink(event) {
  return event.target.tagName === 'A' && !event.target.href.startsWith(window.location.origin)
}

/**
 * @param {PointerEvent} event
 */
function handleClick(event) {
  if (isExternalLink(event)) {
    handleLinkClick(event)
  }
}

/**
 * @param {PointerEvent} event
 */
function handleAuxClick(event) {
  // auxclick fires for all clicks not performed with the primary button
  // only handle the link click if it was the middle button,
  // otherwise the context menu breaks
  if (isExternalLink(event) && event.button === 1) {
    handleLinkClick(event)
  }
}

/**
 * @param {PointerEvent} event
 */
function handleLinkClick(event) {
  const href = event.target.href
  event.preventDefault()

  // Check if it's a YouTube link
  const youtubeUrlPattern = /^https?:\/\/((www\.)?youtube\.com(\/embed)?|youtu\.be)\/.*$/
  const isYoutubeLink = youtubeUrlPattern.test(href)

  if (isYoutubeLink) {
    // `auxclick` is the event type for non-left click
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/auxclick_event
    handleYoutubeLink(href, {
      doCreateNewWindow: event.type === 'auxclick'
    })
  } else if (externalLinkHandling.value === 'doNothing') {
    // Let user know opening external link is disabled via setting
    showToast(t('External link opening has been disabled in the general settings'))
  } else if (externalLinkHandling.value === 'openLinkAfterPrompt') {
    // Storing the URL is necessary as
    // there is no other way to pass the URL to click callback
    lastExternalLinkToBeOpened.value = href
    showExternalLinkOpeningPrompt.value = true
  } else {
    // Open links externally
    openExternalLink(href)
  }
}

async function handleYoutubeLink(href, { doCreateNewWindow = false } = {}) {
  const result = await store.dispatch('getYoutubeUrlInfo', href)

  switch (result.urlType) {
    case 'video': {
      const { videoId, timestamp, playlistId } = result

      const query = {}
      if (timestamp) {
        query.timestamp = timestamp
      }
      if (playlistId && playlistId.length > 0) {
        query.playlistId = playlistId
      }

      openInternalPath({
        path: `/watch/${videoId}`,
        query,
        doCreateNewWindow
      })
      break
    }

    case 'playlist': {
      const { playlistId, query } = result

      openInternalPath({
        path: `/playlist/${playlistId}`,
        query,
        doCreateNewWindow
      })
      break
    }

    case 'search': {
      const { searchQuery, query } = result

      openInternalPath({
        path: `/search/${encodeURIComponent(searchQuery)}`,
        query,
        doCreateNewWindow,
        searchQueryText: searchQuery
      })
      break
    }

    case 'hashtag': {
      const { hashtag } = result
      openInternalPath({
        path: `/hashtag/${encodeURIComponent(hashtag)}`,
        doCreateNewWindow
      })
      break
    }

    case 'post': {
      const { postId, query } = result

      openInternalPath({
        path: `/post/${postId}`,
        query,
        doCreateNewWindow
      })
      break
    }

    case 'channel': {
      const { channelId, subPath, url } = result

      openInternalPath({
        path: `/channel/${channelId}/${subPath}`,
        doCreateNewWindow,
        query: {
          url
        }
      })
      break
    }

    case 'trending':
    case 'subscriptions':
    case 'history':
    case 'userplaylists':
      openInternalPath({
        path: `/${result.urlType}`,
        doCreateNewWindow
      })
      break

    case 'invalid_url': {
      // Do nothing
      break
    }

    default: {
      // Unknown URL type
      showToast(t('Unknown YouTube url type, cannot be opened in app'))
    }
  }
}

function enableOpenUrl() {
  window.ftElectron.handleOpenUrl((url) => {
    if (url) {
      handleYoutubeLink(url)
    }
  })
}

const windowTitle = computed(() => {
  const routePath = route.path
  if (
    !routePath.startsWith('/channel/') &&
    !routePath.startsWith('/watch/') &&
    !routePath.startsWith('/hashtag/') &&
    !routePath.startsWith('/playlist/') &&
    !routePath.startsWith('/search/')
  ) {
    let title = translateWindowTitle(route.meta.title)
    if (!title) {
      title = packageDetails.productName
    } else {
      title = `${title} - ${packageDetails.productName}`
    }
    return title
  } else {
    return null
  }
})

/** @type {import('vue').ComputedRef<string>} */
const appTitle = computed(() => store.getters.getAppTitle)

watch(appTitle, (value) => {
  document.title = value
})

watch(windowTitle, setWindowTitle)

function setWindowTitle() {
  if (windowTitle.value !== null) {
    store.commit('setAppTitle', windowTitle.value)
  }
}

const isLocaleRightToLeft = computed(() => {
  const locale_ = locale.value

  return locale_ === 'ar' || locale_ === 'fa' || locale_ === 'he' ||
  locale_ === 'ur' || locale_ === 'yi' || locale_ === 'ku'
})

watch(locale, (value) => {
  document.documentElement.lang = value

  document.body.dir = isLocaleRightToLeft.value ? 'rtl' : 'ltr'
}, { immediate: true })

// en-US is the fallback locale, which means we always need it
// regardless of the user's settings so we can already start start loading it now
loadLocale('en-US')

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => store.getters.getCurrentInvidiousInstanceUrl)

/**
 * Transforms dragged in-app URLs into YouTube ones, so they they can be dragged into other applications.
 * Cancels the drag operation if the URL is FreeTube specific and cannot be transformed e.g. user playlist URLs
 * @param {DragEvent} event
 */
function handleDragStart(event) {
  if (!event.dataTransfer.types.includes('text/uri-list')) {
    return
  }

  const originalUrlString = event.dataTransfer.getData('text/uri-list')
  const originalUrl = new URL(originalUrlString)

  // Check if this is an in-app URL
  if (originalUrl.origin !== window.location.origin || originalUrl.pathname !== window.location.pathname) {
    return
  }

  const [path, query] = originalUrl.hash.slice(2).split('?')
  const pathParts = path.split('/')
  const params = new URLSearchParams(query)

  let transformed = false
  let transformedURL = new URL('https://www.youtube.com')

  switch (pathParts[0]) {
    case 'watch':
      transformedURL.pathname = '/watch'
      transformedURL.searchParams.set('v', pathParts[1])

      if (params.has('timestamp')) {
        transformedURL.searchParams.set('t', params.get('timestamp') + 's')
      }

      if (params.has('playlistId') && params.get('playlistType') !== 'user') {
        transformedURL.searchParams.set('list', params.get('playlistId'))
      }

      transformed = true
      break
    case 'playlist':
      if (params.get('playlistType') !== 'user') {
        transformedURL.pathname = '/playlist'
        transformedURL.searchParams.set('list', pathParts[1])

        transformed = true
      }
      break
    case 'channel':
      transformedURL.pathname = `/channel/${pathParts[1]}`

      if (pathParts[2]) {
        switch (pathParts[2]) {
          case 'community':
            transformedURL.pathname += '/posts'
            break
          case 'search':
            transformedURL.pathname += '/search'
            if (params.has('searchQueryText')) {
              transformedURL.searchParams.set('query', params.get('searchQueryText'))
            }
            break
          case 'videos':
          case 'shorts':
          case 'releases':
          case 'podcasts':
          case 'courses':
          case 'playlists':
          case 'about':
            transformedURL.pathname += `/${pathParts[2]}`
            break
        }
      }

      transformed = true
      break
    case 'search':
      transformedURL.pathname = '/results'
      transformedURL.searchParams.set('search_query', decodeURIComponent(pathParts[1]))
      transformed = true
      break
    case 'hashtag':
    case 'post':
      transformedURL.pathname = `/${pathParts[0]}/${pathParts[1]}`
      transformed = true
      break
    case 'subscriptions':
    case 'history':
      transformedURL.pathname = `/feed/${pathParts[1]}`
      transformed = true
      break
    case 'userplaylists':
      transformedURL.pathname = '/feed/playlists'
      transformed = true
      break
    case 'settings':
      transformedURL.pathname = '/account'
      transformed = true
      break
    case 'about':
      transformedURL.pathname = '/about'
      transformed = true
      break
    case 'popular':
      transformedURL = new URL(`${currentInvidiousInstanceUrl.value}/feed/popular`)
      transformed = true
      break
  }

  if (transformed) {
    const transformedURLString = transformedURL.toString()

    event.dataTransfer.setData('text/uri-list', transformedURLString)

    const plainText = event.dataTransfer.getData('text/plain')
    if (plainText.length > 0) {
      event.dataTransfer.setData('text/plain', plainText.replaceAll(originalUrlString, transformedURLString))
    }

    const html = event.dataTransfer.getData('text/html')
    if (html.length > 0) {
      const originalUrlStringEncoded = originalUrlString.replaceAll('&', '&amp;')
      const transformedURLStringEncoded = transformedURLString.replaceAll('&', '&amp;')

      event.dataTransfer.setData('text/html', html.replaceAll(originalUrlStringEncoded, transformedURLStringEncoded))
    }
  } else {
    // Cancel the drag operation for FreeTube specific URLs that cannot be transformed such as user playlist URLs
    event.preventDefault()
    event.stopPropagation()
  }
}
</script>

<style src="./themes.css" />
<style scoped src="./App.css" />
