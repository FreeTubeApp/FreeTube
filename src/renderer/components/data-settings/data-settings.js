import { defineComponent } from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import { mapActions, mapMutations } from 'vuex'
import FtButton from '../ft-button/ft-button.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import { MAIN_PROFILE_ID } from '../../../constants'

import { calculateColorLuminance, getRandomColor } from '../../helpers/colors'
import {
  copyToClipboard,
  deepCopy,
  escapeHTML,
  getTodayDateStrLocalTimezone,
  readFileFromDialog,
  showOpenDialog,
  showSaveDialog,
  showToast,
  writeFileFromDialog,
} from '../../helpers/utils'
import { invidiousAPICall } from '../../helpers/api/invidious'
import { getLocalChannel } from '../../helpers/api/local'

export default defineComponent({
  name: 'DataSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-button': FtButton,
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-toggle-switch': FtToggleSwitch,
  },
  data: function () {
    return {
      showExportSubscriptionsPrompt: false,
      subscriptionsPromptValues: [
        'freetube',
        'youtubenew',
        'youtube',
        'youtubeold',
        'newpipe'
      ],

      shouldExportPlaylistForOlderVersions: false,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    allPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },
    historyCacheSorted: function () {
      return this.$store.getters.getHistoryCacheSorted
    },
    exportSubscriptionsPromptNames: function () {
      const exportFreeTube = this.$t('Settings.Data Settings.Export FreeTube')
      const exportYouTube = this.$t('Settings.Data Settings.Export YouTube')
      const exportNewPipe = this.$t('Settings.Data Settings.Export NewPipe')
      return [
        `${exportFreeTube} (.db)`,
        `${exportYouTube} (.csv)`,
        `${exportYouTube} (.json)`,
        `${exportYouTube} (.opml)`,
        `${exportNewPipe} (.json)`
      ]
    },
    primaryProfile: function () {
      return deepCopy(this.profileList[0])
    }
  },
  methods: {
    openProfileSettings: function () {
      this.$router.push({
        path: '/settings/profile/'
      })
    },

    importSubscriptions: async function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: this.$t('Settings.Data Settings.Subscription File'),
            extensions: ['db', 'csv', 'json', 'opml', 'xml']
          }
        ]
      }

      const response = await showOpenDialog(options)
      if (response.canceled || response.filePaths?.length === 0) {
        return
      }
      let textDecode
      try {
        textDecode = await readFileFromDialog(response)
      } catch (err) {
        const message = this.$t('Settings.Data Settings.Unable to read file')
        showToast(`${message}: ${err}`)
        return
      }
      response.filePaths.forEach(filePath => {
        if (filePath.endsWith('.csv')) {
          this.importCsvYouTubeSubscriptions(textDecode)
        } else if (filePath.endsWith('.db')) {
          this.importFreeTubeSubscriptions(textDecode)
        } else if (filePath.endsWith('.opml') || filePath.endsWith('.xml')) {
          this.importOpmlYouTubeSubscriptions(textDecode)
        } else if (filePath.endsWith('.json')) {
          textDecode = JSON.parse(textDecode)
          if (textDecode.subscriptions) {
            this.importNewPipeSubscriptions(textDecode)
          } else {
            this.importYouTubeSubscriptions(textDecode)
          }
        }
      })
    },

    importFreeTubeSubscriptions: function (textDecode) {
      textDecode = textDecode.split('\n')
      textDecode.pop()
      textDecode = textDecode.map(data => JSON.parse(data))

      const firstEntry = textDecode[0]
      if (firstEntry.channelId && firstEntry.channelName && firstEntry.channelThumbnail && firstEntry._id && firstEntry.profile) {
        // Old FreeTube subscriptions format detected, so convert it to the new one:
        textDecode = this.convertOldFreeTubeFormatToNew(textDecode)
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
            const message = this.$t('Settings.Data Settings.Unknown data key')
            showToast(`${message}: ${key}`)
          } else {
            profileObject[key] = profileData[key]
          }
        })

        if (Object.keys(profileObject).length < requiredKeys.length) {
          const message = this.$t('Settings.Data Settings.Profile object has insufficient data, skipping item')
          showToast(message)
        } else {
          if (profileObject._id === MAIN_PROFILE_ID) {
            this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.concat(profileObject.subscriptions)
            this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.filter((sub, index) => {
              const profileIndex = this.primaryProfile.subscriptions.findIndex((x) => {
                return x.name === sub.name
              })

              return profileIndex === index
            })
            this.updateProfile(this.primaryProfile)
          } else {
            const existingProfileIndex = this.profileList.findIndex((profile) => {
              return profile.name.includes(profileObject.name)
            })

            if (existingProfileIndex !== -1) {
              const existingProfile = deepCopy(this.profileList[existingProfileIndex])
              existingProfile.subscriptions = existingProfile.subscriptions.concat(profileObject.subscriptions)
              existingProfile.subscriptions = existingProfile.subscriptions.filter((sub, index) => {
                const profileIndex = existingProfile.subscriptions.findIndex((x) => {
                  return x.name === sub.name
                })

                return profileIndex === index
              })
              this.updateProfile(existingProfile)
            } else {
              this.updateProfile(profileObject)
            }

            this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.concat(profileObject.subscriptions)
            this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.filter((sub, index) => {
              const profileIndex = this.primaryProfile.subscriptions.findIndex((x) => {
                return x.name === sub.name
              })

              return profileIndex === index
            })
            this.updateProfile(this.primaryProfile)
          }
        }
      })

      showToast(this.$t('Settings.Data Settings.All subscriptions and profiles have been successfully imported'))
    },

    importCsvYouTubeSubscriptions: async function(textDecode) { // first row = header, last row = empty
      const youtubeSubscriptions = textDecode.split('\n').filter(sub => {
        return sub !== ''
      })
      const subscriptions = []
      const errorList = []

      showToast(this.$t('Settings.Data Settings.This might take a while, please wait'))

      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)
      let count = 0

      const splitCSVRegex = /(?:,|\n|^)("(?:(?:"")|[^"])*"|[^\n",]*|(?:\n|$))/g

      const ytsubs = youtubeSubscriptions.slice(1).map(yt => {
        return [...yt.matchAll(splitCSVRegex)].map(s => {
          let newVal = s[1]
          if (newVal.startsWith('"')) {
            newVal = newVal.substring(1, newVal.length - 2).replaceAll('""', '"')
          }
          return newVal
        })
      }).filter(channel => {
        return channel.length > 0
      })
      new Promise((resolve) => {
        let finishCount = 0
        ytsubs.forEach(async (yt) => {
          const { subscription, result } = await this.subscribeToChannel({
            channelId: yt[0],
            subscriptions: subscriptions,
            channelName: yt[2],
            count: count++,
            total: ytsubs.length
          })
          if (result === 1) {
            subscriptions.push(subscription)
          } else if (result === -1) {
            errorList.push(yt)
          }
          finishCount++
          if (finishCount === ytsubs.length) {
            resolve(true)
          }
        })
      }).then(_ => {
        this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.concat(subscriptions)
        this.updateProfile(this.primaryProfile)
        if (errorList.length !== 0) {
          errorList.forEach(e => { // log it to console for now, dedicated tab for 'error' channels needed
            console.error(`failed to import ${e[2]}. Url to channel: ${e[1]}.`)
          })
          showToast(this.$t('Settings.Data Settings.One or more subscriptions were unable to be imported'))
        } else {
          showToast(this.$t('Settings.Data Settings.All subscriptions have been successfully imported'))
        }
      }).finally(_ => {
        this.updateShowProgressBar(false)
      })
    },

    importYouTubeSubscriptions: async function (textDecode) {
      const subscriptions = []
      const errorList = []

      showToast(this.$t('Settings.Data Settings.This might take a while, please wait'))

      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)

      let count = 0
      new Promise((resolve) => {
        let finishCount = 0
        textDecode.forEach(async (channel) => {
          const snippet = channel.snippet
          if (typeof snippet === 'undefined') {
            const message = this.$t('Settings.Data Settings.Invalid subscriptions file')
            showToast(message)
            throw new Error('Unable to find channel data')
          }
          const { subscription, result } = await this.subscribeToChannel({
            channelId: snippet.resourceId.channelId,
            subscriptions: subscriptions,
            channelName: snippet.title,
            thumbnail: snippet.thumbnails.default.url,
            count: count++,
            total: textDecode.length
          })
          if (result === 1) {
            subscriptions.push(subscription)
          } else if (result === -1) {
            errorList.push([snippet.resourceId.channelId, `https://www.youtube.com/channel/${snippet.resourceId.channelId}`, snippet.title])
          }
          finishCount++
          if (finishCount === textDecode.length) {
            resolve(true)
          }
        })
      }).then(_ => {
        this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.concat(subscriptions)
        this.updateProfile(this.primaryProfile)
        if (errorList.length !== 0) {
          errorList.forEach(e => { // log it to console for now, dedicated tab for 'error' channels needed
            console.error(`failed to import ${e[2]}. Url to channel: ${e[1]}.`)
          })
          showToast(this.$t('Settings.Data Settings.One or more subscriptions were unable to be imported'))
        } else {
          showToast(this.$t('Settings.Data Settings.All subscriptions have been successfully imported'))
        }
      }).finally(_ => {
        this.updateShowProgressBar(false)
      })
    },

    importOpmlYouTubeSubscriptions: async function (data) {
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
          const message = this.$t('Settings.Data Settings.Invalid subscriptions file')
          showToast(`${message}: ${err}`)
          return
        }
      }

      const feedData = xmlDom.querySelectorAll('body outline[xmlUrl]')
      if (feedData.length === 0) {
        const message = this.$t('Settings.Data Settings.Invalid subscriptions file')
        showToast(message)
        return
      }

      const subscriptions = []

      showToast(this.$t('Settings.Data Settings.This might take a while, please wait'))

      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)

      let count = 0

      feedData.forEach(async (channel) => {
        const xmlUrl = channel.getAttribute('xmlUrl')
        let channelId
        if (xmlUrl.includes('https://www.youtube.com/feeds/videos.xml?channel_id=')) {
          channelId = new URL(xmlUrl).searchParams.get('channel_id')
        } else if (xmlUrl.includes('/feed/channel/')) {
          // handle invidious exports https://yewtu.be/feed/channel/{CHANNELID}
          channelId = new URL(xmlUrl).pathname.split('/').filter(part => part).at(-1)
        } else {
          console.error(`Unknown xmlUrl format: ${xmlUrl}`)
        }
        const subExists = this.primaryProfile.subscriptions.findIndex((sub) => {
          return sub.id === channelId
        })
        if (subExists === -1) {
          let channelInfo
          if (this.backendPreference === 'invidious') {
            channelInfo = await this.getChannelInfoInvidious(channelId)
          } else {
            channelInfo = await this.getChannelInfoLocal(channelId)
          }

          if (typeof channelInfo.author !== 'undefined') {
            const subscription = {
              id: channelId,
              name: channelInfo.author,
              thumbnail: channelInfo.authorThumbnails[1].url
            }
            subscriptions.push(subscription)
          }
        }

        count++

        const progressPercentage = (count / feedData.length) * 100
        this.setProgressBarPercentage(progressPercentage)

        if (count === feedData.length) {
          this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.concat(subscriptions)
          this.updateProfile(this.primaryProfile)

          if (subscriptions.length < count) {
            showToast(this.$t('Settings.Data Settings.One or more subscriptions were unable to be imported'))
          } else {
            showToast(this.$t('Settings.Data Settings.All subscriptions have been successfully imported'))
          }

          this.updateShowProgressBar(false)
        }
      })
    },

    importNewPipeSubscriptions: async function (newPipeData) {
      if (typeof newPipeData.subscriptions === 'undefined') {
        showToast(this.$t('Settings.Data Settings.Invalid subscriptions file'))

        return
      }

      const newPipeSubscriptions = newPipeData.subscriptions.filter((channel, index) => {
        return new URL(channel.url).hostname === 'www.youtube.com'
      })

      const subscriptions = []
      const errorList = []

      showToast(this.$t('Settings.Data Settings.This might take a while, please wait'))

      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)

      let count = 0

      new Promise((resolve) => {
        let finishCount = 0
        newPipeSubscriptions.forEach(async (channel, index) => {
          const channelId = channel.url.replace(/https:\/\/(www\.)?youtube\.com\/channel\//, '')
          const { subscription, result } = await this.subscribeToChannel({
            channelId: channelId,
            subscriptions: subscriptions,
            channelName: channel.name,
            count: count++,
            total: newPipeSubscriptions.length
          })
          if (result === 1) {
            subscriptions.push(subscription)
          }
          if (result === -1) {
            errorList.push([channelId, channel.url, channel.name])
          }
          finishCount++
          if (finishCount === newPipeSubscriptions.length) {
            resolve(true)
          }
        })
      }).then(_ => {
        this.primaryProfile.subscriptions = this.primaryProfile.subscriptions.concat(subscriptions)
        this.updateProfile(this.primaryProfile)
        if (errorList.count > 0) {
          errorList.forEach(e => { // log it to console for now, dedicated tab for 'error' channels needed
            console.error(`failed to import ${e[2]}. Url to channel: ${e[1]}.`)
          })
          showToast(this.$t('Settings.Data Settings.One or more subscriptions were unable to be imported'))
        } else {
          showToast(this.$t('Settings.Data Settings.All subscriptions have been successfully imported'))
        }
      }).finally(_ => {
        this.updateShowProgressBar(false)
      })
    },

    exportSubscriptions: function (option) {
      this.showExportSubscriptionsPrompt = false

      if (option === null) {
        return
      }

      switch (option) {
        case 'freetube':
          this.exportFreeTubeSubscriptions()
          break
        case 'youtubenew':
          this.exportCsvYouTubeSubscriptions()
          break
        case 'youtube':
          this.exportYouTubeSubscriptions()
          break
        case 'youtubeold':
          this.exportOpmlYouTubeSubscriptions()
          break
        case 'newpipe':
          this.exportNewPipeSubscriptions()
          break
      }
    },

    exportFreeTubeSubscriptions: async function () {
      const subscriptionsDb = this.profileList.map((profile) => {
        return JSON.stringify(profile)
      }).join('\n') + '\n'// a trailing line is expected
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'freetube-subscriptions-' + dateStr + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: this.$t('Settings.Data Settings.Subscription File'),
            extensions: ['db']
          }
        ]
      }

      await this.promptAndWriteToFile(options, subscriptionsDb, this.$t('Settings.Data Settings.Subscriptions have been successfully exported'))
    },

    exportYouTubeSubscriptions: async function () {
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'youtube-subscriptions-' + dateStr + '.json'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: this.$t('Settings.Data Settings.Subscription File'),
            extensions: ['json']
          }
        ]
      }

      const subscriptionsObject = this.profileList[0].subscriptions.map((channel) => {
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

      await this.promptAndWriteToFile(options, JSON.stringify(subscriptionsObject), this.$t('Settings.Data Settings.Subscriptions have been successfully exported'))
    },

    exportOpmlYouTubeSubscriptions: async function () {
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'youtube-subscriptions-' + dateStr + '.opml'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: this.$t('Settings.Data Settings.Subscription File'),
            extensions: ['opml']
          }
        ]
      }

      let opmlData = '<opml version="1.1"><body><outline text="YouTube Subscriptions" title="YouTube Subscriptions">'

      this.profileList[0].subscriptions.forEach((channel) => {
        const escapedName = escapeHTML(channel.name)

        const channelOpmlString = `<outline text="${escapedName}" title="${escapedName}" type="rss" xmlUrl="https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}"/>`
        opmlData += channelOpmlString
      })

      opmlData += '</outline></body></opml>'

      await this.promptAndWriteToFile(options, opmlData, this.$t('Settings.Data Settings.Subscriptions have been successfully exported'))
    },

    exportCsvYouTubeSubscriptions: async function () {
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'youtube-subscriptions-' + dateStr + '.csv'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: this.$t('Settings.Data Settings.Subscription File'),
            extensions: ['csv']
          }
        ]
      }
      let exportText = 'Channel ID,Channel URL,Channel title\n'
      this.profileList[0].subscriptions.forEach((channel) => {
        const channelUrl = `https://www.youtube.com/channel/${channel.id}`
        let channelName = channel.name
        if (channelName.search(',') !== -1) { // add quotations and escape existing quotations if channel has comma in name
          channelName = `"${channelName.replaceAll('"', '""')}"`
        }
        exportText += `${channel.id},${channelUrl},${channelName}\n`
      })
      exportText += '\n'

      await this.promptAndWriteToFile(options, exportText, this.$t('Settings.Data Settings.Subscriptions have been successfully exported'))
    },

    exportNewPipeSubscriptions: async function () {
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'newpipe-subscriptions-' + dateStr + '.json'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: this.$t('Settings.Data Settings.Subscription File'),
            extensions: ['json']
          }
        ]
      }

      const newPipeObject = {
        app_version: '0.19.8',
        app_version_int: 953,
        subscriptions: []
      }

      this.profileList[0].subscriptions.forEach((channel) => {
        const channelUrl = `https://www.youtube.com/channel/${channel.id}`
        const subscription = {
          service_id: 0,
          url: channelUrl,
          name: channel.name
        }

        newPipeObject.subscriptions.push(subscription)
      })

      await this.promptAndWriteToFile(options, JSON.stringify(newPipeObject), this.$t('Settings.Data Settings.Subscriptions have been successfully exported'))
    },

    importHistory: async function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: this.$t('Settings.Data Settings.History File'),
            extensions: ['db', 'json']
          }
        ]
      }

      const response = await showOpenDialog(options)
      if (response.canceled || response.filePaths?.length === 0) {
        return
      }
      let textDecode
      try {
        textDecode = await readFileFromDialog(response)
      } catch (err) {
        const message = this.$t('Settings.Data Settings.Unable to read file')
        showToast(`${message}: ${err}`)
        return
      }

      response.filePaths.forEach(filePath => {
        if (filePath.endsWith('.db')) {
          this.importFreeTubeHistory(textDecode.split('\n'))
        } else if (filePath.endsWith('.json')) {
          this.importYouTubeHistory(JSON.parse(textDecode))
        }
      })
    },

    importFreeTubeHistory(textDecode) {
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
        'viewCount',
        'watchProgress',
      ]

      const optionalKeys = [
        // `_id` absent if marked as watched manually
        '_id',
        'lastViewedPlaylistId',
      ]

      const ignoredKeys = [
        'paid',
      ]

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
          showToast(this.$t('Settings.Data Settings.History object has insufficient data, skipping item'))
          console.error('Missing Keys: ', missingKeys, historyData)
        } else {
          this.updateHistory(historyObject)
        }
      })

      showToast(this.$t('Settings.Data Settings.All watched history has been successfully imported'))
    },

    importYouTubeHistory(historyData) {
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
          showToast(this.$t('Settings.Data Settings.History object has insufficient data, skipping item'))
        } else {
          // YouTube history export does not have this data, setting some defaults.
          historyObject.type = 'video'
          historyObject.published = historyObject.timeWatched ?? 1
          historyObject.description = ''
          historyObject.lengthSeconds = null
          historyObject.watchProgress = 1
          historyObject.isLive = false

          this.updateHistory(historyObject)
        }
      })

      showToast(this.$t('Settings.Data Settings.All watched history has been successfully imported'))
    },

    exportHistory: async function () {
      const historyDb = this.historyCacheSorted.map((historyEntry) => {
        return JSON.stringify(historyEntry)
      }).join('\n') + '\n'
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'freetube-history-' + dateStr + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: this.$t('Settings.Data Settings.Playlist File'),
            extensions: ['db']
          }
        ]
      }

      await this.promptAndWriteToFile(options, historyDb, this.$t('Settings.Data Settings.All watched history has been successfully exported'))
    },

    importPlaylists: async function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: this.$t('Settings.Data Settings.Playlist File'),
            extensions: ['db']
          }
        ]
      }

      const response = await showOpenDialog(options)
      if (response.canceled || response.filePaths?.length === 0) {
        return
      }
      let data
      try {
        data = await readFileFromDialog(response)
      } catch (err) {
        const message = this.$t('Settings.Data Settings.Unable to read file')
        showToast(`${message}: ${err}`)
        return
      }
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
        'description',
        'createdAt',
      ]

      const ignoredKeys = [
        '_id',
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

      const requiredVideoKeys = [
        'videoId',
        'title',
        'author',
        'authorId',
        'lengthSeconds',
        'timeAdded',

        // `playlistItemId` should be optional for backward compatibility
        // 'playlistItemId',
      ]

      playlists.forEach((playlistData) => {
        // We would technically already be done by the time the data is parsed,
        // however we want to limit the possibility of malicious data being sent
        // to the app, so we'll only grab the data we need here.

        const playlistObject = {}

        Object.keys(playlistData).forEach((key) => {
          if ([requiredKeys, optionalKeys, ignoredKeys].every((ks) => !ks.includes(key))) {
            const message = `${this.$t('Settings.Data Settings.Unknown data key')}: ${key}`
            showToast(message)
          } else if (key === 'videos') {
            const videoArray = []
            playlistData.videos.forEach((video) => {
              const videoPropertyKeys = Object.keys(video)
              const videoObjectHasAllRequiredKeys = requiredVideoKeys.every((k) => videoPropertyKeys.includes(k))

              if (videoObjectHasAllRequiredKeys) {
                videoArray.push(video)
              }
            })

            playlistObject[key] = videoArray
          } else if (!ignoredKeys.includes(key)) {
            // Do nothing for keys to be ignored
            playlistObject[key] = playlistData[key]
          }
        })

        const playlistObjectKeys = Object.keys(playlistObject)
        const playlistObjectHasAllRequiredKeys = requiredKeys.every((k) => playlistObjectKeys.includes(k))

        if (playlistObjectHasAllRequiredKeys) {
          const existingPlaylist = this.allPlaylists.find((playlist) => {
            return playlist.playlistName === playlistObject.playlistName
          })

          if (existingPlaylist !== undefined) {
            playlistObject.videos.forEach((video) => {
              let videoExists = false
              if (video.playlistItemId != null) {
                // Find by `playlistItemId` if present
                videoExists = existingPlaylist.videos.some((x) => {
                  // Allow duplicate (by videoId) videos to be added
                  return x.videoId === video.videoId && x.playlistItemId === video.playlistItemId
                })
              } else {
                // Older playlist exports have no `playlistItemId` but have `timeAdded`
                // Which might be duplicate for copied playlists with duplicate `videoId`
                videoExists = existingPlaylist.videos.some((x) => {
                  // Allow duplicate (by videoId) videos to be added
                  return x.videoId === video.videoId && x.timeAdded === video.timeAdded
                })
              }

              if (!videoExists) {
                // Keep original `timeAdded` value
                const payload = {
                  _id: existingPlaylist._id,
                  videoData: video,
                }

                this.addVideo(payload)
              }
            })
            // Update playlist's `lastUpdatedAt`
            this.updatePlaylist({ _id: existingPlaylist._id })
          } else {
            this.addPlaylist(playlistObject)
          }
        } else {
          const message = this.$t('Settings.Data Settings.Playlist insufficient data', { playlist: playlistData.playlistName })
          showToast(message)
        }
      })

      showToast(this.$t('Settings.Data Settings.All playlists has been successfully imported'))
    },

    exportPlaylists: async function () {
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'freetube-playlists-' + dateStr + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: 'Database File',
            extensions: ['db']
          }
        ]
      }

      const playlistsDb = this.allPlaylists.map(playlist => {
        return JSON.stringify(playlist)
      }).join('\n') + '\n'// a trailing line is expected

      await this.promptAndWriteToFile(options, playlistsDb, this.$t('Settings.Data Settings.All playlists has been successfully exported'))
    },

    exportPlaylistsForOlderVersionsSometimes: function () {
      if (this.shouldExportPlaylistForOlderVersions) {
        this.exportPlaylistsForOlderVersions()
      } else {
        this.exportPlaylists()
      }
    },

    exportPlaylistsForOlderVersions: async function () {
      const dateStr = getTodayDateStrLocalTimezone()
      const exportFileName = 'freetube-playlists-as-single-favorites-playlist-' + dateStr + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: 'Database File',
            extensions: ['db']
          }
        ]
      }

      const favoritesPlaylistData = {
        playlistName: 'Favorites',
        protected: true,
        videos: [],
      }

      this.allPlaylists.forEach((playlist) => {
        playlist.videos.forEach((video) => {
          const videoAlreadyAdded = favoritesPlaylistData.videos.some((v) => {
            return v.videoId === video.videoId
          })
          if (videoAlreadyAdded) { return }

          favoritesPlaylistData.videos.push(
            Object.assign({
              // The "required" keys during import (but actually unused) in older versions
              isLive: false,
              paid: false,
              published: '',
            }, video)
          )
        })
      })

      await this.promptAndWriteToFile(options, JSON.stringify([favoritesPlaylistData]), this.$t('Settings.Data Settings.All playlists has been successfully exported'))
    },

    convertOldFreeTubeFormatToNew(oldData) {
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
          } else if (listOfProfilesAlreadyAdded.indexOf(index) !== -1) {
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
    },

    promptAndWriteToFile: async function (saveOptions, content, successMessage) {
      const response = await showSaveDialog(saveOptions)
      if (response.canceled || response.filePath === '') {
        // User canceled the save dialog
        return
      }

      try {
        await writeFileFromDialog(response, content)
      } catch (writeErr) {
        const message = this.$t('Settings.Data Settings.Unable to write file')
        showToast(`${message}: ${writeErr}`)
        return
      }

      showToast(successMessage)
    },

    getChannelInfoInvidious: function (channelId) {
      return new Promise((resolve, reject) => {
        const subscriptionsPayload = {
          resource: 'channels',
          id: channelId,
          params: {}
        }

        invidiousAPICall(subscriptionsPayload).then((response) => {
          resolve(response)
        }).catch((err) => {
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })

          if (process.env.SUPPORTS_LOCAL_API && this.backendFallback && this.backendPreference === 'invidious') {
            showToast(this.$t('Falling back to Local API'))
            resolve(this.getChannelInfoLocal(channelId))
          } else {
            resolve([])
          }
        })
      })
    },

    getChannelInfoLocal: async function (channelId) {
      try {
        const channel = await getLocalChannel(channelId)

        if (channel.alert) {
          return []
        }

        return {
          author: channel.header.author.name,
          authorThumbnails: channel.header.author.thumbnails
        }
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })

        if (this.backendFallback && this.backendPreference === 'local') {
          showToast(this.$t('Falling back to Invidious API'))
          return await this.getChannelInfoInvidious(channelId)
        } else {
          return []
        }
      }
    },

    /*
    TODO: allow default thumbnail to be used to limit requests to YouTube
    (thumbnail will get updated when user goes to their channel page)
    Returns:
    -1: an error occured
    0: already subscribed
    1: successfully subscribed
    */
    async subscribeToChannel({ channelId, subscriptions, channelName = null, thumbnail = null, count = 0, total = 0 }) {
      let result = 1
      if (this.isChannelSubscribed(channelId, subscriptions)) {
        return { subscription: null, successMessage: 0 }
      }

      let channelInfo
      let subscription = null
      if (channelName === null || thumbnail === null) {
        try {
          if (this.backendPreference === 'invidious') {
            channelInfo = await this.getChannelInfoInvidious(channelId)
          } else {
            channelInfo = await this.getChannelInfoLocal(channelId)
          }
        } catch (err) {
          console.error(err)
          result = -1
        }
      } else {
        channelInfo = { author: channelName, authorThumbnails: [null, { url: thumbnail }] }
      }

      if (typeof channelInfo.author !== 'undefined') {
        subscription = {
          id: channelId,
          name: channelInfo.author,
          thumbnail: channelInfo.authorThumbnails[1].url
        }
      } else {
        result = -1
      }
      const progressPercentage = (count / (total - 1)) * 100
      this.setProgressBarPercentage(progressPercentage)
      return { subscription, result }
    },

    isChannelSubscribed(channelId, subscriptions) {
      if (channelId === null) { return true }
      const subExists = this.primaryProfile.subscriptions.findIndex((sub) => {
        return sub.id === channelId
      }) !== -1

      const subDuplicateExists = subscriptions.findIndex((sub) => {
        return sub.id === channelId
      }) !== -1
      return subExists || subDuplicateExists
    },

    ...mapActions([
      'updateProfile',
      'updateShowProgressBar',
      'updateHistory',
      'addPlaylist',
      'addVideo',
      'updatePlaylist',
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
