<template>
  <FtSettingsSection
    :title="$t('Settings.Data Settings.Data Settings')"
  >
    <h4 class="groupTitle">
      {{ $t('Subscriptions.Subscriptions') }}
    </h4>
    <FtFlexBox class="dataSettingsBox">
      <FtButton
        :label="$t('Settings.Data Settings.Import Subscriptions')"
        @click="importSubscriptions"
      />
      <FtButton
        :label="$t('Settings.Data Settings.Manage Subscriptions')"
        @click="openProfileSettings"
      />
      <FtButton
        :label="$t('Settings.Data Settings.Export Subscriptions')"
        @click="showExportSubscriptionsPrompt = true"
      />
    </FtFlexBox>
    <FtFlexBox>
      <p>
        <a href="https://docs.freetubeapp.io/usage/importing-subscriptions/">
          {{ $t("Settings.Data Settings.How do I import my subscriptions?") }}
        </a>
      </p>
    </FtFlexBox>
    <h4 class="groupTitle">
      {{ $t('History.History') }}
    </h4>
    <FtFlexBox class="dataSettingsBox">
      <FtButton
        :label="$t('Settings.Data Settings.Import History')"
        @click="importHistory"
      />
      <FtButton
        :label="$t('Settings.Data Settings.Export History')"
        @click="exportHistory"
      />
    </FtFlexBox>
    <h4 class="groupTitle">
      {{ $t('Playlists') }}
    </h4>
    <FtFlexBox class="dataSettingsBox">
      <FtButton
        :label="$t('Settings.Data Settings.Import Playlists')"
        @click="importPlaylists"
      />
      <FtButton
        :label="$t('Settings.Data Settings.Export Playlists')"
        @click="exportPlaylists"
      />
    </FtFlexBox>
    <FtPrompt
      v-if="showExportSubscriptionsPrompt"
      :label="$t('Settings.Data Settings.Select Export Type')"
      :option-names="exportSubscriptionsPromptNames"
      :option-values="SUBSCRIPTIONS_PROMPT_VALUES"
      @click="exportSubscriptions"
    />
  </FtSettingsSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/use-i18n-polyfill'
import { useRouter } from 'vue-router/composables'

import FtButton from './FtButton/FtButton.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtPrompt from './FtPrompt/FtPrompt.vue'
import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'

import store from '../store/index'

import { MAIN_PROFILE_ID } from '../../constants'
import { calculateColorLuminance, getRandomColor } from '../helpers/colors'
import {
  deepCopy,
  escapeHTML,
  getTodayDateStrLocalTimezone,
  readFileWithPicker,
  showToast,
  writeFileWithPicker,
} from '../helpers/utils'
import { processToBeAddedPlaylistVideo } from '../helpers/playlists'

const IMPORT_DIRECTORY_ID = 'data-settings-import'
const START_IN_DIRECTORY = 'downloads'

const { t } = useI18n()
const router = useRouter()

function openProfileSettings() {
  router.push('/settings/profile')
}

/**
 * @param {string} fileName
 * @param {string | Blob} content
 * @param {string} fileTypeDescription
 * @param {string} mimeType
 * @param {string} fileExtension
 * @param {string} successMessage
 */
async function promptAndWriteToFile(
  fileName,
  content,
  fileTypeDescription,
  mimeType,
  fileExtension,
  successMessage
) {
  try {
    const response = await writeFileWithPicker(
      fileName,
      content,
      fileTypeDescription,
      mimeType,
      fileExtension,
      'data-settings-export',
      START_IN_DIRECTORY
    )

    if (response) {
      showToast(successMessage)
    }
  } catch (error) {
    const message = t('Settings.Data Settings.Unable to write file')
    showToast(`${message}: ${error}`)
  }
}

const SUBSCRIPTIONS_PROMPT_VALUES = [
  'freetube',
  'youtubenew',
  'youtube',
  'youtubeold',
  'newpipe',
  'close'
]

const exportSubscriptionsPromptNames = computed(() => {
  const exportFreeTube = t('Settings.Data Settings.Export FreeTube')
  const exportYouTube = t('Settings.Data Settings.Export YouTube')
  const exportNewPipe = t('Settings.Data Settings.Export NewPipe')

  return [
    `${exportFreeTube} (.db)`,
    `${exportYouTube} (.csv)`,
    `${exportYouTube} (.json)`,
    `${exportYouTube} (.opml)`,
    `${exportNewPipe} (.json)`,
    t('Close')
  ]
})

const profileList = computed(() => store.getters.getProfileList)
const primaryProfile = computed(() => deepCopy(profileList.value[0]))

// #region subscriptions import

async function importSubscriptions() {
  let response
  try {
    response = await readFileWithPicker(
      t('Settings.Data Settings.Subscription File'),
      {
        'application/x-freetube-db': '.db',
        'text/csv': '.csv',
        'application/json': '.json',
        'application/xml': ['.xml', '.opml']
      },
      IMPORT_DIRECTORY_ID,
      START_IN_DIRECTORY
    )
  } catch (err) {
    const message = t('Settings.Data Settings.Unable to read file')
    showToast(`${message}: ${err}`)
    return
  }

  if (response === null) {
    return
  }

  const { filename, content } = response

  if (filename.endsWith('.csv')) {
    importCsvYouTubeSubscriptions(content)
  } else if (filename.endsWith('.db')) {
    importFreeTubeSubscriptions(content)
  } else if (filename.endsWith('.opml') || filename.endsWith('.xml')) {
    importOpmlYouTubeSubscriptions(content)
  } else if (filename.endsWith('.json')) {
    const jsonContent = JSON.parse(content)
    if (jsonContent.subscriptions) {
      importNewPipeSubscriptions(jsonContent)
    } else {
      importYouTubeSubscriptions(jsonContent)
    }
  }
}

/**
 * @param {string | null} channelId
 * @param {{ id: string, name: string, thumbnail: string | null }[]} subscriptions
 */
function isChannelSubscribed(channelId, subscriptions) {
  if (channelId === null) { return true }

  const subExists = primaryProfile.value.subscriptions.some((sub) => {
    return sub.id === channelId
  })

  const subDuplicateExists = subscriptions.some((sub) => {
    return sub.id === channelId
  })

  return subExists || subDuplicateExists
}

/**
 * @param {any[]} oldData
 */
function convertOldFreeTubeFormatToNew(oldData) {
  const convertedData = []
  for (const channel of oldData) {
    const listOfProfilesAlreadyAdded = []
    for (const profile of channel.profile) {
      let index = convertedData.findIndex(p => p.name === profile.value)
      if (index === -1) { // profile doesn't exist yet
        const randomBgColor = getRandomColor().value
        const contrastyTextColor = calculateColorLuminance(randomBgColor)
        convertedData.push({
          name: profile.value,
          bgColor: randomBgColor,
          textColor: contrastyTextColor,
          subscriptions: [],
          _id: channel._id
        })
        index = convertedData.length - 1
      } else if (listOfProfilesAlreadyAdded.includes(index)) {
        continue
      }
      listOfProfilesAlreadyAdded.push(index)
      convertedData[index].subscriptions.push({
        id: channel.channelId,
        name: channel.channelName,
        thumbnail: channel.channelThumbnail
      })
    }
  }
  return convertedData
}

/**
 * @param {string} textDecode
 */
function importFreeTubeSubscriptions(textDecode) {
  textDecode = textDecode.split('\n')
  textDecode.pop()
  textDecode = textDecode.map(data => JSON.parse(data))

  const firstEntry = textDecode[0]
  if (firstEntry.channelId && firstEntry.channelName && firstEntry.channelThumbnail && firstEntry._id && firstEntry.profile) {
    // Old FreeTube subscriptions format detected, so convert it to the new one:
    textDecode = convertOldFreeTubeFormatToNew(textDecode)
  }

  const requiredKeys = [
    '_id',
    'name',
    'bgColor',
    'textColor',
    'subscriptions'
  ]

  textDecode.forEach((profileData) => {
    // We would technically already be done by the time the data is parsed,
    // however we want to limit the possibility of malicious data being sent
    // to the app, so we'll only grab the data we need here.

    const profileObject = {}
    Object.keys(profileData).forEach((key) => {
      if (!requiredKeys.includes(key)) {
        const message = t('Settings.Data Settings.Unknown data key')
        showToast(`${message}: ${key}`)
      } else {
        profileObject[key] = profileData[key]
      }
    })

    if (Object.keys(profileObject).length < requiredKeys.length) {
      const message = t('Settings.Data Settings.Profile object has insufficient data, skipping item')
      showToast(message)
    } else {
      if (profileObject._id === MAIN_PROFILE_ID) {
        primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.concat(profileObject.subscriptions)
        primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.filter((sub, index) => {
          const profileIndex = primaryProfile.value.subscriptions.findIndex((x) => {
            return x.id === sub.id
          })

          return profileIndex === index
        })
        store.dispatch('updateProfile', primaryProfile.value)
      } else {
        const existingProfileIndex = profileList.value.findIndex((profile) => {
          return profile.name.includes(profileObject.name)
        })

        if (existingProfileIndex !== -1) {
          const existingProfile = deepCopy(profileList.value[existingProfileIndex])
          existingProfile.subscriptions = existingProfile.subscriptions.concat(profileObject.subscriptions)
          existingProfile.subscriptions = existingProfile.subscriptions.filter((sub, index) => {
            const profileIndex = existingProfile.subscriptions.findIndex((x) => {
              return x.id === sub.id
            })

            return profileIndex === index
          })
          store.dispatch('updateProfile', existingProfile)
        } else {
          store.dispatch('updateProfile', profileObject)
        }

        primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.concat(profileObject.subscriptions)
        primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.filter((sub, index) => {
          const profileIndex = primaryProfile.value.subscriptions.findIndex((x) => {
            return x.id === sub.id
          })

          return profileIndex === index
        })
        store.dispatch('updateProfile', primaryProfile.value)
      }
    }
  })

  showToast(t('Settings.Data Settings.All subscriptions and profiles have been successfully imported'))
}

/**
 * @param {string} textDecode
 */
function importCsvYouTubeSubscriptions(textDecode) { // first row = header, last row = empty
  const youtubeSubscriptions = textDecode.split('\n').filter(sub => {
    return sub !== ''
  })
  const subscriptions = []

  store.commit('setShowProgressBar', true)
  store.commit('setProgressBarPercentage', 0)

  const splitCSVRegex = /(?:,|\n|^)("(?:(?:"")|[^"])*"|[^\n",]*|(?:\n|$))/g

  const ytsubs = youtubeSubscriptions.slice(1).map(yt => {
    return [...yt.matchAll(splitCSVRegex)].map(s => {
      let newVal = s[1]
      if (newVal.startsWith('"')) {
        newVal = newVal.substring(1, newVal.length - 1).replaceAll('""', '"')
      }
      return newVal
    })
  }).filter(channel => {
    return channel.length > 0
  })

  ytsubs.forEach((yt) => {
    const channelId = yt[0]
    if (!isChannelSubscribed(channelId, subscriptions)) {
      const subscription = {
        id: channelId,
        name: yt[2],
        thumbnail: null
      }

      subscriptions.push(subscription)
    }
  })

  primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.concat(subscriptions)
  store.dispatch('updateProfile', primaryProfile.value)
  showToast(t('Settings.Data Settings.All subscriptions have been successfully imported'))
  store.commit('setShowProgressBar', false)
}

/**
 * @param {object} textDecode
 */
function importYouTubeSubscriptions(textDecode) {
  const subscriptions = []
  let count = 0

  showToast(t('Settings.Data Settings.This might take a while, please wait'))

  store.commit('setShowProgressBar', true)
  store.commit('setProgressBarPercentage', 0)

  textDecode.forEach((channel) => {
    const snippet = channel.snippet
    if (typeof snippet === 'undefined') {
      const message = t('Settings.Data Settings.Invalid subscriptions file')
      showToast(message)
      throw new Error('Unable to find channel data')
    }

    const channelId = snippet.resourceId.channelId
    if (!isChannelSubscribed(channelId, subscriptions)) {
      subscriptions.push({
        id: channelId,
        name: snippet.title,
        thumbnail: snippet.thumbnails.default.url
      })
    }

    count++

    const progressPercentage = (count / (textDecode.length - 1)) * 100
    store.commit('setProgressBarPercentage', progressPercentage)
  })

  primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.concat(subscriptions)
  store.dispatch('updateProfile', primaryProfile.value)
  showToast(t('Settings.Data Settings.All subscriptions have been successfully imported'))
  store.commit('setShowProgressBar', false)
}

/**
 * @param {string} data
 */
function importOpmlYouTubeSubscriptions(data) {
  let xmlDom
  const domParser = new DOMParser()
  try {
    xmlDom = domParser.parseFromString(data, 'application/xml')

    // https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#error_handling
    const errorNode = xmlDom.querySelector('parsererror')
    if (errorNode) {
      throw errorNode.textContent
    }
  } catch (err) {
    console.error('error reading OPML subscriptions file, falling back to HTML parser...')
    console.error(err)
    // try parsing with the html parser instead which is more lenient
    try {
      const htmlDom = domParser.parseFromString(data, 'text/html')

      xmlDom = htmlDom
    } catch {
      const message = t('Settings.Data Settings.Invalid subscriptions file')
      showToast(`${message}: ${err}`)
      return
    }
  }

  const feedData = xmlDom.querySelectorAll('body outline[xmlUrl]')
  if (feedData.length === 0) {
    const message = t('Settings.Data Settings.Invalid subscriptions file')
    showToast(message)
    return
  }

  const subscriptions = []

  store.commit('setShowProgressBar', true)
  store.commit('setProgressBarPercentage', 0)

  let count = 0

  feedData.forEach((channel) => {
    const xmlUrl = channel.getAttribute('xmlUrl')
    const channelName = channel.getAttribute('title')
    let channelId
    if (xmlUrl.includes('https://www.youtube.com/feeds/videos.xml?channel_id=')) {
      channelId = new URL(xmlUrl).searchParams.get('channel_id')
    } else if (xmlUrl.includes('/feed/channel/')) {
      // handle invidious exports https://yewtu.be/feed/channel/{CHANNELID}
      channelId = new URL(xmlUrl).pathname.split('/').filter(part => part).at(-1)
    } else {
      console.error(`Unknown xmlUrl format: ${xmlUrl}`)
    }

    if (!isChannelSubscribed(channelId, subscriptions)) {
      const subscription = {
        id: channelId,
        name: channelName,
        thumbnail: null
      }
      subscriptions.push(subscription)
    }

    count++

    const progressPercentage = (count / feedData.length) * 100
    store.commit('setProgressBarPercentage', progressPercentage)
  })

  primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.concat(subscriptions)
  store.dispatch('updateProfile', primaryProfile.value)
  showToast(t('Settings.Data Settings.All subscriptions have been successfully imported'))
  store.commit('setShowProgressBar', false)
}

/**
 * @param {object} newPipeData
 */
function importNewPipeSubscriptions(newPipeData) {
  if (typeof newPipeData.subscriptions === 'undefined') {
    showToast(t('Settings.Data Settings.Invalid subscriptions file'))

    return
  }

  const newPipeSubscriptions = newPipeData.subscriptions.filter((channel) => {
    return new URL(channel.url).hostname === 'www.youtube.com'
  })

  const subscriptions = []

  store.commit('setShowProgressBar', true)
  store.commit('setProgressBarPercentage', 0)

  let count = 0

  newPipeSubscriptions.forEach((channel) => {
    const channelId = channel.url.replace(/https:\/\/(www\.)?youtube\.com\/channel\//, '')

    if (!isChannelSubscribed(channelId, subscriptions)) {
      subscriptions.push({
        id: channelId,
        name: channel.name,
        thumbnail: null
      })
    }
    count++

    const progressPercentage = (count / (newPipeSubscriptions.length - 1)) * 100
    store.commit('setProgressBarPercentage', progressPercentage)
  })

  primaryProfile.value.subscriptions = primaryProfile.value.subscriptions.concat(subscriptions)
  store.dispatch('updateProfile', primaryProfile.value)
  showToast(t('Settings.Data Settings.All subscriptions have been successfully imported'))
  store.commit('updateShowProgressBar', false)
}

// #endregion subscriptions import

// #region subscriptions export

const showExportSubscriptionsPrompt = ref(false)

/**
 * @param {'freetube' | 'youtubenew' | 'youtube' | 'youtubeold' | 'newpipe' | 'close' | null} option
 */
function exportSubscriptions(option) {
  showExportSubscriptionsPrompt.value = false

  if (option === null) {
    return
  }

  switch (option) {
    case 'freetube':
      exportFreeTubeSubscriptions()
      break
    case 'youtubenew':
      exportCsvYouTubeSubscriptions()
      break
    case 'youtube':
      exportYouTubeSubscriptions()
      break
    case 'youtubeold':
      exportOpmlYouTubeSubscriptions()
      break
    case 'newpipe':
      exportNewPipeSubscriptions()
      break
  }
}

async function exportFreeTubeSubscriptions() {
  const subscriptionsDb = profileList.value.map((profile) => {
    return JSON.stringify(profile)
  }).join('\n') + '\n'// a trailing line is expected
  const dateStr = getTodayDateStrLocalTimezone()
  const exportFileName = 'freetube-subscriptions-' + dateStr + '.db'

  await promptAndWriteToFile(
    exportFileName,
    subscriptionsDb,
    t('Settings.Data Settings.Subscription File'),
    'application/x-freetube-db',
    '.db',
    t('Settings.Data Settings.Subscriptions have been successfully exported')
  )
}

async function exportYouTubeSubscriptions() {
  const dateStr = getTodayDateStrLocalTimezone()
  const exportFileName = 'youtube-subscriptions-' + dateStr + '.json'

  const subscriptionsObject = profileList.value[0].subscriptions.map((channel) => {
    const object = {
      contentDetails: {
        activityType: 'all',
        newItemCount: 0,
        totalItemCount: 0
      },
      etag: '',
      id: '',
      kind: 'youtube#subscription',
      snippet: {
        channelId: channel.id,
        description: '',
        publishedAt: new Date(),
        resourceId: {
          channelId: channel.id,
          kind: 'youtube#channel'
        },
        thumbnails: {
          default: {
            url: channel.thumbnail
          },
          high: {
            url: channel.thumbnail
          },
          medium: {
            url: channel.thumbnail
          }
        },
        title: channel.name
      }
    }

    return object
  })

  await promptAndWriteToFile(
    exportFileName,
    JSON.stringify(subscriptionsObject),
    t('Settings.Data Settings.Subscription File'),
    'application/json',
    '.json',
    t('Settings.Data Settings.Subscriptions have been successfully exported')
  )
}

async function exportOpmlYouTubeSubscriptions() {
  const dateStr = getTodayDateStrLocalTimezone()
  const exportFileName = 'youtube-subscriptions-' + dateStr + '.opml'

  let opmlData = '<opml version="1.1"><body><outline text="YouTube Subscriptions" title="YouTube Subscriptions">'

  profileList.value[0].subscriptions.forEach((channel) => {
    const escapedName = escapeHTML(channel.name)

    const channelOpmlString = `<outline text="${escapedName}" title="${escapedName}" type="rss" xmlUrl="https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}"/>`
    opmlData += channelOpmlString
  })

  opmlData += '</outline></body></opml>'

  await promptAndWriteToFile(
    exportFileName,
    opmlData,
    t('Settings.Data Settings.Subscription File'),
    'application/xml',
    '.opml',
    t('Settings.Data Settings.Subscriptions have been successfully exported')
  )
}

async function exportCsvYouTubeSubscriptions() {
  const dateStr = getTodayDateStrLocalTimezone()
  const exportFileName = 'youtube-subscriptions-' + dateStr + '.csv'

  let exportText = 'Channel ID,Channel URL,Channel title\n'
  profileList.value[0].subscriptions.forEach((channel) => {
    const channelUrl = `https://www.youtube.com/channel/${channel.id}`

    // always have channel name quoted to simplify things
    const channelName = `"${channel.name.replaceAll('"', '""')}"`
    exportText += `${channel.id},${channelUrl},${channelName}\n`
  })
  exportText += '\n'

  await promptAndWriteToFile(
    exportFileName,
    exportText,
    t('Settings.Data Settings.Subscription File'),
    'text/csv',
    '.csv',
    t('Settings.Data Settings.Subscriptions have been successfully exported')
  )
}

async function exportNewPipeSubscriptions() {
  const dateStr = getTodayDateStrLocalTimezone()
  const exportFileName = 'newpipe-subscriptions-' + dateStr + '.json'

  const newPipeObject = {
    app_version: '0.19.8',
    app_version_int: 953,
    subscriptions: []
  }

  profileList.value[0].subscriptions.forEach((channel) => {
    const channelUrl = `https://www.youtube.com/channel/${channel.id}`
    const subscription = {
      service_id: 0,
      url: channelUrl,
      name: channel.name
    }

    newPipeObject.subscriptions.push(subscription)
  })

  await promptAndWriteToFile(
    exportFileName,
    JSON.stringify(newPipeObject),
    t('Settings.Data Settings.Subscription File'),
    'application/json',
    '.json',
    t('Settings.Data Settings.Subscriptions have been successfully exported')
  )
}

// #endregion subscriptions export

// #region history

const historyCacheById = computed(() => {
  return store.getters.getHistoryCacheById
})

const historyCacheSorted = computed(() => {
  return store.getters.getHistoryCacheSorted
})

async function importHistory() {
  let response
  try {
    response = await readFileWithPicker(
      t('Settings.Data Settings.History File'),
      {
        'application/x-freetube-db': '.db',
        'application/json': '.json'
      },
      IMPORT_DIRECTORY_ID,
      START_IN_DIRECTORY
    )
  } catch (err) {
    const message = t('Settings.Data Settings.Unable to read file')
    showToast(`${message}: ${err}`)
    return
  }

  if (response === null) {
    return
  }

  const { filename, content } = response

  if (filename.endsWith('.db')) {
    importFreeTubeHistory(content.split('\n'))
  } else if (filename.endsWith('.json')) {
    importYouTubeHistory(JSON.parse(content))
  }
}

/**
 * @param {string[]} textDecode
 */
async function importFreeTubeHistory(textDecode) {
  textDecode.pop()

  const requiredKeys = [
    'author',
    'authorId',
    'description',
    'isLive',
    'lengthSeconds',
    'published',
    'timeWatched',
    'title',
    'type',
    'videoId',
    'watchProgress',
  ]

  const optionalKeys = [
    // `_id` absent if marked as watched manually
    '_id',
    'lastViewedPlaylistId',
    'lastViewedPlaylistItemId',
    'lastViewedPlaylistType',
    'viewCount',
  ]

  const ignoredKeys = [
    'paid',
  ]

  const historyItems = new Map(Object.entries(historyCacheById.value))

  textDecode.forEach((history) => {
    const historyData = JSON.parse(history)
    // We would technically already be done by the time the data is parsed,
    // however we want to limit the possibility of malicious data being sent
    // to the app, so we'll only grab the data we need here.

    const historyObject = {}

    Object.keys(historyData).forEach((key) => {
      if (requiredKeys.includes(key) || optionalKeys.includes(key)) {
        historyObject[key] = historyData[key]
      } else if (!ignoredKeys.includes(key)) {
        showToast(`Unknown data key: ${key}`)
      }
      // Else do not import the key
    })

    const historyObjectKeysSet = new Set(Object.keys(historyObject))
    const missingKeys = requiredKeys.filter(x => !historyObjectKeysSet.has(x))
    if (missingKeys.length > 0) {
      showToast(t('Settings.Data Settings.History object has insufficient data, skipping item'))
      console.error('Missing Keys: ', missingKeys, historyData)
    } else {
      historyItems.set(historyObject.videoId, historyObject)
    }
  })

  await store.dispatch('overwriteHistory', historyItems)

  showToast(t('Settings.Data Settings.All watched history has been successfully imported'))
}

/**
 * @param {any[]} historyData
 */
async function importYouTubeHistory(historyData) {
  const filterPredicate = item =>
    item.products.includes('YouTube') &&
    item.titleUrl != null && // removed video doesnt contain url...
    item.titleUrl.includes('www.youtube.com/watch?v') &&
    item.details == null // dont import ads

  const filteredHistoryData = historyData.filter(filterPredicate)

  // remove 'Watched' and translated variants from start of title
  // so we get the common string prefix for all the titles
  const getCommonStart = (allTitles) => {
    const watchedTitle = allTitles[0].split(' ')
    allTitles.forEach((title) => {
      const splitTitle = title.split(' ')
      for (let wtIndex = 0; wtIndex <= watchedTitle.length; wtIndex++) {
        if (!splitTitle.includes(watchedTitle[wtIndex])) {
          watchedTitle.splice(wtIndex, watchedTitle.length - wtIndex)
        }
      }
    })

    return watchedTitle.join(' ')
  }

  const commonStart = getCommonStart(filteredHistoryData.map(e => e.title))
  // We would technically already be done by the time the data is parsed,
  // however we want to limit the possibility of malicious data being sent
  // to the app, so we'll only grab the data we need here.

  const keyMapping = {
    title: [{ importKey: 'title', predicate: item => item.slice(commonStart.length) }], // Removes the "Watched " term on the title
    titleUrl: [{ importKey: 'videoId', predicate: item => item.replaceAll(/https:\/\/www\.youtube\.com\/watch\?v=/gi, '') }], // Extracts the video ID
    time: [{ importKey: 'timeWatched', predicate: item => new Date(item).valueOf() }],
    subtitles: [
      { importKey: 'author', predicate: item => item[0].name ?? '' },
      { importKey: 'authorId', predicate: item => item[0].url?.replaceAll(/https:\/\/www\.youtube\.com\/channel\//gi, '') ?? '' },
    ],
  }

  const knownKeys = [
    'header',
    'description',
    'products',
    'details',
    'activityControls',
  ].concat(Object.keys(keyMapping))

  const historyItems = new Map(Object.entries(historyCacheById.value))

  filteredHistoryData.forEach(element => {
    const historyObject = {}

    Object.keys(element).forEach((key) => {
      if (!knownKeys.includes(key)) {
        showToast(`Unknown data key: ${key}`)
      } else {
        const mapping = keyMapping[key]

        if (mapping && Array.isArray(mapping)) {
          mapping.forEach(item => {
            historyObject[item.importKey] = item.predicate(element[key])
          })
        }
      }
    })

    if (Object.keys(historyObject).length < keyMapping.length - 1) {
      showToast(t('Settings.Data Settings.History object has insufficient data, skipping item'))
    } else {
      // YouTube history export does not have this data, setting some defaults.
      historyObject.type = 'video'
      historyObject.published = historyObject.timeWatched ?? 1
      historyObject.description = ''
      historyObject.lengthSeconds = null
      historyObject.watchProgress = 1
      historyObject.isLive = false

      historyItems.set(historyObject.videoId, historyObject)
    }
  })

  await store.dispatch('overwriteHistory', historyItems)

  showToast(t('Settings.Data Settings.All watched history has been successfully imported'))
}

async function exportHistory() {
  const historyDb = historyCacheSorted.value.map((historyEntry) => {
    return JSON.stringify(historyEntry)
  }).join('\n') + '\n'
  const dateStr = getTodayDateStrLocalTimezone()
  const exportFileName = 'freetube-history-' + dateStr + '.db'

  await promptAndWriteToFile(
    exportFileName,
    historyDb,
    t('Settings.Data Settings.History File'),
    'application/x-freetube-db',
    '.db',
    t('Settings.Data Settings.All watched history has been successfully exported')
  )
}

// #endregion history

// #region playlists

const allPlaylists = computed(() => store.getters.getAllPlaylists)

async function importPlaylists() {
  let response
  try {
    response = await readFileWithPicker(
      t('Settings.Data Settings.Playlist File'),
      {
        'application/x-freetube-db': '.db'
      },
      IMPORT_DIRECTORY_ID,
      START_IN_DIRECTORY
    )
  } catch (err) {
    const message = t('Settings.Data Settings.Unable to read file')
    showToast(`${message}: ${err}`)
    return
  }

  if (response === null) {
    return
  }

  let data = response.content

  let playlists = null

  // for the sake of backwards compatibility,
  // check if this is the old JSON array export (used until version 0.19.1),
  // that didn't match the actual database format
  const trimmedData = data.trim()

  if (trimmedData[0] === '[' && trimmedData[trimmedData.length - 1] === ']') {
    playlists = JSON.parse(trimmedData)
  } else {
    // otherwise assume this is the correct database format,
    // which is also what we export now (used in 0.20.0 and later versions)
    data = data.split('\n')
    data.pop()

    playlists = data.map(playlistJson => JSON.parse(playlistJson))
  }

  const requiredKeys = [
    'playlistName',
    'videos',
  ]

  const optionalKeys = [
    '_id',
    'description',
    'createdAt',
  ]

  const ignoredKeys = [
    'title',
    'type',
    'protected',
    'lastUpdatedAt',
    'lastPlayedAt',
    'removeOnWatched',

    'thumbnail',
    'channelName',
    'channelId',
    'playlistId',
    'videoCount',
  ]

  const knownKeys = [...requiredKeys, ...optionalKeys, ...ignoredKeys]

  const requiredVideoKeys = [
    'videoId',
    'title',
    'lengthSeconds',
    'timeAdded',

    // These two properties will be missing for shorts added to a playlist from anywhere but the watch page
    // 'author',
    // 'authorId',

    // `playlistItemId` should be optional for backward compatibility
    // 'playlistItemId',
  ]

  const newPlaylists = []

  playlists.forEach((playlistData) => {
    // We would technically already be done by the time the data is parsed,
    // however we want to limit the possibility of malicious data being sent
    // to the app, so we'll only grab the data we need here.

    const playlistObject = {}
    const videoIdToBeAddedSet = new Set()
    let countRequiredKeysPresent = 0

    Object.keys(playlistData).forEach((key) => {
      if (!knownKeys.includes(key)) {
        const message = `${t('Settings.Data Settings.Unknown data key')}: ${key}`
        showToast(message)
      } else if (key === 'videos') {
        const videoArray = []
        playlistData.videos.forEach((video) => {
          const videoPropertyKeys = Object.keys(video)
          const videoObjectHasAllRequiredKeys = requiredVideoKeys.every((k) => videoPropertyKeys.includes(k))

          if (videoObjectHasAllRequiredKeys) {
            videoArray.push(video)
            videoIdToBeAddedSet.add(video.videoId)
          }
        })

        playlistObject.videos = videoArray

        if (requiredKeys.includes(key)) {
          countRequiredKeysPresent++
        }
      } else if (!ignoredKeys.includes(key)) {
        // Do nothing for keys to be ignored
        playlistObject[key] = playlistData[key]

        if (requiredKeys.includes(key)) {
          countRequiredKeysPresent++
        }
      }
    })

    if (countRequiredKeysPresent !== requiredKeys.length) {
      const message = t('Settings.Data Settings.Playlist insufficient data', { playlist: playlistData.playlistName })
      showToast(message)
      return
    }

    const existingPlaylist = allPlaylists.value.find((playlist) => {
      if (playlistObject._id != null && playlist._id === playlistObject._id) {
        return true
      }

      return playlist.playlistName === playlistObject.playlistName
    })

    if (existingPlaylist === undefined) {
      newPlaylists.push(playlistObject)
      return
    }

    /** @type {Set<string> | undefined} */
    let existingVideoIdSet

    let shouldAddDuplicateVideos = playlistObject.videos.length > videoIdToBeAddedSet.size

    if (!shouldAddDuplicateVideos) {
      existingVideoIdSet = existingPlaylist.videos.reduce((set, video) => set.add(video.videoId), new Set())
      shouldAddDuplicateVideos = existingPlaylist.videos.length > existingVideoIdSet.size
    }

    const playlistVideos = [...existingPlaylist.videos]

    playlistObject.videos.forEach((video) => {
      let videoExists = false
      if (shouldAddDuplicateVideos) {
        if (video.playlistItemId != null) {
          // Find by `playlistItemId` if present
          videoExists = playlistVideos.some((x) => {
            // Allow duplicate (by videoId) videos to be added
            return x.videoId === video.videoId && x.playlistItemId === video.playlistItemId
          })
        } else {
          // Older playlist exports have no `playlistItemId` but have `timeAdded`
          // Which might be duplicate for copied playlists with duplicate `videoId`
          videoExists = playlistVideos.some((x) => {
            // Allow duplicate (by videoId) videos to be added
            return x.videoId === video.videoId && x.timeAdded === video.timeAdded
          })
        }
      } else if (existingVideoIdSet !== undefined) {
        // Disallow duplicate (by videoId) videos to be added

        if (existingVideoIdSet.has(video.videoId)) {
          videoExists = true
        } else {
          existingVideoIdSet.add(video.videoId)
        }
      } else {
        videoExists = playlistVideos.some((x) => {
          // Disallow duplicate (by videoId) videos to be added
          return x.videoId === video.videoId
        })
      }

      if (!videoExists) {
        // Keep original `timeAdded` value
        processToBeAddedPlaylistVideo(video)
        playlistVideos.push(video)
      }
    })
    // Update playlist's `lastUpdatedAt` & other attributes
    store.dispatch('updatePlaylist', {
      _id: existingPlaylist._id,
      // Only these attributes would be updated (besides videos)
      playlistName: playlistObject.playlistName,
      description: playlistObject.description,
      videos: playlistVideos
    })
  })

  if (newPlaylists.length > 0) {
    store.dispatch('addPlaylists', newPlaylists)
  }

  showToast(t('Settings.Data Settings.All playlists has been successfully imported'))
}

async function exportPlaylists() {
  const dateStr = getTodayDateStrLocalTimezone()
  const exportFileName = 'freetube-playlists-' + dateStr + '.db'

  const playlistsDb = allPlaylists.value.map(playlist => {
    return JSON.stringify(playlist)
  }).join('\n') + '\n'// a trailing line is expected

  await promptAndWriteToFile(
    exportFileName,
    playlistsDb,
    t('Settings.Data Settings.Playlist File'),
    'application/x-freetube-db',
    '.db',
    t('Settings.Data Settings.All playlists has been successfully exported')
  )
}

// #endregion playlists
</script>
