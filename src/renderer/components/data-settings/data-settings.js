import Vue from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'

import { remote } from 'electron'
import fs from 'fs'
import opmlToJson from 'opml-to-json'
import ytch from 'yt-channel-info'

const app = remote.app
const dialog = remote.dialog

export default Vue.extend({
  name: 'DataSettings',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
      showImportSubscriptionsPrompt: false,
      showExportSubscriptionsPrompt: false,
      subscriptionsPromptValues: [
        'freetube',
        'youtube',
        'newpipe'
      ]
    }
  },
  computed: {
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
    },
    saveWatchedProgress: function () {
      return this.$store.getters.getSaveWatchedProgress
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    importSubscriptionsPromptNames: function () {
      const importFreeTube = this.$t('Settings.Data Settings.Import FreeTube')
      const importYouTube = this.$t('Settings.Data Settings.Import YouTube')
      const importNewPipe = this.$t('Settings.Data Settings.Import NewPipe')
      return [
        `${importFreeTube} (.db)`,
        `${importYouTube} (.opml)`,
        `${importNewPipe} (.json)`
      ]
    },
    exportSubscriptionsPromptNames: function () {
      const exportFreeTube = this.$t('Settings.Data Settings.Export FreeTube')
      const exportYouTube = this.$t('Settings.Data Settings.Export YouTube')
      const exportNewPipe = this.$t('Settings.Data Settings.Export NewPipe')
      return [
        `${exportFreeTube} (.db)`,
        `${exportYouTube} (.opml)`,
        `${exportNewPipe} (.json)`
      ]
    }
  },
  methods: {
    importSubscriptions: function (option) {
      this.showImportSubscriptionsPrompt = false

      if (option === null) {
        return
      }

      switch (option) {
        case 'freetube':
          this.importFreeTubeSubscriptions()
          break
        case 'youtube':
          this.importYouTubeSubscriptions()
          break
        case 'newpipe':
          this.importNewPipeSubscriptions()
          break
      }
    },

    importFreeTubeSubscriptions: function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: 'Database File',
            extensions: ['db']
          }
        ]
      }

      dialog.showOpenDialog(options).then((response) => {
        if (response.canceled || response.filePaths.length === 0) {
          return
        }

        const filePath = response.filePaths[0]

        fs.readFile(filePath, async (err, data) => {
          if (err) {
            const message = this.$t('Settings.Data Settings.Unable to read file')
            this.showToast({
              message: `${message}: ${err}`
            })
            return
          }

          let textDecode = new TextDecoder('utf-8').decode(data)
          textDecode = textDecode.split('\n')
          textDecode.pop()
          textDecode = textDecode.map(data => JSON.parse(data))

          let importingOldFormat = false
          const firstEntry = textDecode[0]
          if (firstEntry.channelId && firstEntry.channelName && firstEntry.channelThumbnail && firstEntry._id && firstEntry.profile) {
            // Old FreeTube subscriptions format detected, so convert it to the new one:
            textDecode = await this.convertOldFreeTubeFormatToNew(textDecode)
            importingOldFormat = true
          }

          textDecode.forEach((profileData) => {
            // We would technically already be done by the time the data is parsed,
            // however we want to limit the possibility of malicious data being sent
            // to the app, so we'll only grab the data we need here.

            const requiredKeys = [
              '_id',
              'name',
              'bgColor',
              'textColor',
              'subscriptions'
            ]

            const profileObject = {}

            Object.keys(profileData).forEach((key) => {
              if (!requiredKeys.includes(key)) {
                const message = this.$t('Settings.Data Settings.Unknown data key')
                this.showToast({
                  message: `${message}: ${key}`
                })
              } else {
                profileObject[key] = profileData[key]
              }
            })

            if (Object.keys(profileObject).length < requiredKeys.length) {
              const message = this.$t('Settings.Data Settings.Profile object has insufficient data, skipping item')
              this.showToast({
                message: message
              })
            } else {
              if (importingOldFormat && profileObject.name === 'All Channels') {
                const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))
                // filter out subscriptions that already exist before concatenating
                profileObject.subscriptions = profileObject.subscriptions.filter(newSub => {
                  const existingSub = primaryProfile.subscriptions.find(existingSub => existingSub.id === newSub.id)
                  return !existingSub // return false if sub already exists in default profile
                })
                primaryProfile.subscriptions = primaryProfile.subscriptions.concat(profileObject.subscriptions)
                this.updateProfile(primaryProfile)
              } else {
                this.updateProfile(profileObject)
              }
            }
          })

          this.showToast({
            message: this.$t('Settings.Data Settings.All subscriptions and profiles have been successfully imported')
          })
        })
      })
    },

    importYouTubeSubscriptions: function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: 'Database File',
            extensions: ['*']
          }
        ]
      }

      dialog.showOpenDialog(options).then(async (response) => {
        if (response.canceled || response.filePaths.length === 0) {
          return
        }

        const filePath = response.filePaths[0]

        fs.readFile(filePath, async (err, data) => {
          if (err) {
            const message = this.$t('Settings.Data Settings.Unable to read file')
            this.showToast({
              message: `${message}: ${err}`
            })
            return
          }

          opmlToJson(data, async (err, json) => {
            if (err) {
              console.log(err)
              const message = this.$t('Settings.Data Settings.Invalid subscriptions file')
              this.showToast({
                message: `${message}: ${err}`
              })
              return
            }

            const feedData = json.children[0].children

            if (typeof feedData === 'undefined') {
              const message = this.$t('Settings.Data Settings.Invalid subscriptions file')
              this.showToast({
                message: message
              })

              return
            }

            const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))
            const subscriptions = []

            this.showToast({
              message: this.$t('Settings.Data Settings.This might take a while, please wait')
            })

            this.updateShowProgressBar(true)
            this.setProgressBarPercentage(0)

            let count = 0

            feedData.forEach(async (channel, index) => {
              const channelId = channel.xmlurl.replace('https://www.youtube.com/feeds/videos.xml?channel_id=', '')
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

              count++

              const progressPercentage = (count / feedData.length) * 100
              this.setProgressBarPercentage(progressPercentage)

              if (count === feedData.length) {
                primaryProfile.subscriptions = primaryProfile.subscriptions.concat(subscriptions)
                this.updateProfile(primaryProfile)

                if (subscriptions.length < count) {
                  this.showToast({
                    message: this.$t('Settings.Data Settings.One or more subscriptions were unable to be imported')
                  })
                } else {
                  this.showToast({
                    message: this.$t('Settings.Data Settings.All subscriptions have been successfully imported')
                  })
                }

                this.updateShowProgressBar(false)
              }
            })
          })
        })
      })
    },

    importNewPipeSubscriptions: function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: 'Database File',
            extensions: ['json']
          }
        ]
      }

      dialog.showOpenDialog(options).then(async (response) => {
        if (response.canceled || response.filePaths.length === 0) {
          return
        }

        const filePath = response.filePaths[0]

        fs.readFile(filePath, async (err, data) => {
          if (err) {
            const message = this.$t('Settings.Data Settings.Unable to read file')
            this.showToast({
              message: `${message}: ${err}`
            })
            return
          }

          const newPipeData = JSON.parse(data)

          if (typeof newPipeData.subscriptions === 'undefined') {
            this.showToast({
              message: this.$t('Settings.Data Settings.Invalid subscriptions file')
            })

            return
          }

          const newPipeSubscriptions = newPipeData.subscriptions

          const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))
          const subscriptions = []

          this.showToast({
            message: this.$t('Settings.Data Settings.This might take a while, please wait')
          })

          this.updateShowProgressBar(true)
          this.setProgressBarPercentage(0)

          let count = 0

          newPipeSubscriptions.forEach(async (channel, index) => {
            const channelId = channel.url.replace(/https:\/\/(www\.)?youtube\.com\/channel\//, '')
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

            count++

            const progressPercentage = (count / newPipeSubscriptions.length) * 100
            this.setProgressBarPercentage(progressPercentage)

            if (count === newPipeSubscriptions.length) {
              primaryProfile.subscriptions = primaryProfile.subscriptions.concat(subscriptions)
              this.updateProfile(primaryProfile)

              if (subscriptions.length < count) {
                this.showToast({
                  message: this.$t('Settings.Data Settings.One or more subscriptions were unable to be imported')
                })
              } else {
                this.showToast({
                  message: this.$t('Settings.Data Settings.All subscriptions have been successfully imported')
                })
              }

              this.updateShowProgressBar(false)
            }
          })
        })
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
        case 'youtube':
          this.exportYouTubeSubscriptions()
          break
        case 'newpipe':
          this.exportNewPipeSubscriptions()
          break
      }
    },

    exportFreeTubeSubscriptions: function () {
      const userData = app.getPath('userData')
      const subscriptionsDb = `${userData}/profiles.db`
      const date = new Date()
      let dateMonth = date.getMonth() + 1

      if (dateMonth < 10) {
        dateMonth = '0' + dateMonth
      }

      let dateDay = date.getDate()

      if (dateDay < 10) {
        dateDay = '0' + dateDay
      }

      const dateYear = date.getFullYear()
      const exportFileName = 'freetube-subscriptions-' + dateYear + '-' + dateMonth + '-' + dateDay + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: 'Database File',
            extensions: ['db']
          }
        ]
      }

      dialog.showSaveDialog(options).then((response) => {
        if (response.canceled || response.filePath === '') {
          // User canceled the save dialog
          return
        }

        const filePath = response.filePath

        fs.readFile(subscriptionsDb, (readErr, data) => {
          if (readErr) {
            const message = this.$t('Settings.Data Settings.Unable to read file')
            this.showToast({
              message: `${message}: ${readErr}`
            })
            return
          }

          fs.writeFile(filePath, data, (writeErr) => {
            if (writeErr) {
              const message = this.$t('Settings.Data Settings.Unable to write file')
              this.showToast({
                message: `${message}: ${writeErr}`
              })
              return
            }

            this.showToast({
              message: this.$t('Settings.Data Settings.Subscriptions have been successfully exported')
            })
          })
        })
      })
    },

    exportYouTubeSubscriptions: async function () {
      const date = new Date()
      let dateMonth = date.getMonth() + 1

      if (dateMonth < 10) {
        dateMonth = '0' + dateMonth
      }

      let dateDay = date.getDate()

      if (dateDay < 10) {
        dateDay = '0' + dateDay
      }

      const dateYear = date.getFullYear()
      const exportFileName = 'youtube-subscriptions-' + dateYear + '-' + dateMonth + '-' + dateDay + '.opml'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: 'Database File',
            extensions: ['opml']
          }
        ]
      }

      let opmlData = '<opml version="1.1"><body><outline text="YouTube Subscriptions" title="YouTube Subscriptions">'
      const endingOpmlString = '</outline></body></opml>'

      let count = 0

      this.profileList[0].subscriptions.forEach((channel) => {
        const channelOpmlString = `<outline text="${channel.name}" title="${channel.name}" type="rss" xmlUrl="https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}"/>`
        count++
        opmlData += channelOpmlString

        if (count === this.profileList[0].subscriptions.length) {
          opmlData += endingOpmlString
        }
      })

      dialog.showSaveDialog(options).then((response) => {
        if (response.canceled || response.filePath === '') {
          // User canceled the save dialog
          return
        }

        const filePath = response.filePath

        fs.writeFile(filePath, opmlData, (writeErr) => {
          if (writeErr) {
            const message = this.$t('Settings.Data Settings.Unable to write file')
            this.showToast({
              message: `${message}: ${writeErr}`
            })
            return
          }

          this.showToast({
            message: this.$t('Settings.Data Settings.Subscriptions have been successfully exported')
          })
        })
      })
    },

    exportNewPipeSubscriptions: function () {
      const date = new Date()
      let dateMonth = date.getMonth() + 1

      if (dateMonth < 10) {
        dateMonth = '0' + dateMonth
      }

      let dateDay = date.getDate()

      if (dateDay < 10) {
        dateDay = '0' + dateDay
      }

      const dateYear = date.getFullYear()
      const exportFileName = 'newpipe-subscriptions-' + dateYear + '-' + dateMonth + '-' + dateDay + '.json'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: 'Database File',
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

      dialog.showSaveDialog(options).then((response) => {
        if (response.canceled || response.filePath === '') {
          // User canceled the save dialog
          return
        }

        const filePath = response.filePath

        fs.writeFile(filePath, JSON.stringify(newPipeObject), (writeErr) => {
          if (writeErr) {
            const message = this.$t('Settings.Data Settings.Unable to write file')
            this.showToast({
              message: `${message}: ${writeErr}`
            })
            return
          }

          this.showToast({
            message: this.$t('Settings.Data Settings.Subscriptions have been successfully exported')
          })
        })
      })
    },

    importHistory: function () {
      const options = {
        properties: ['openFile'],
        filters: [
          {
            name: 'Database File',
            extensions: ['db']
          }
        ]
      }

      dialog.showOpenDialog(options).then((response) => {
        if (response.canceled || response.filePaths.length === 0) {
          return
        }

        const filePath = response.filePaths[0]

        fs.readFile(filePath, async (err, data) => {
          if (err) {
            const message = this.$t('Settings.Data Settings.Unable to read file')
            this.showToast({
              message: `${message}: ${err}`
            })
            return
          }

          let textDecode = new TextDecoder('utf-8').decode(data)
          textDecode = textDecode.split('\n')
          textDecode.pop()

          textDecode.forEach((history) => {
            const historyData = JSON.parse(history)
            // We would technically already be done by the time the data is parsed,
            // however we want to limit the possibility of malicious data being sent
            // to the app, so we'll only grab the data we need here.
            const requiredKeys = [
              '_id',
              'author',
              'authorId',
              'description',
              'isLive',
              'lengthSeconds',
              'paid',
              'published',
              'timeWatched',
              'title',
              'type',
              'videoId',
              'viewCount',
              'watchProgress'
            ]

            const historyObject = {}

            Object.keys(historyData).forEach((key) => {
              if (!requiredKeys.includes(key)) {
                this.showToast({
                  message: `Unknown data key: ${key}`
                })
              } else {
                historyObject[key] = historyData[key]
              }
            })

            if (Object.keys(historyObject).length < requiredKeys.length) {
              this.showToast({
                message: this.$t('Settings.Data Settings.History object has insufficient data, skipping item')
              })
            } else {
              this.updateHistory(historyObject)
            }
          })

          this.showToast({
            message: this.$t('Settings.Data Settings.All watched history has been successfully imported')
          })
        })
      })
    },

    exportHistory: function () {
      const userData = app.getPath('userData')
      const historyDb = `${userData}/history.db`
      const date = new Date()
      let dateMonth = date.getMonth() + 1

      if (dateMonth < 10) {
        dateMonth = '0' + dateMonth
      }

      let dateDay = date.getDate()

      if (dateDay < 10) {
        dateDay = '0' + dateDay
      }

      const dateYear = date.getFullYear()
      const exportFileName = 'freetube-history-' + dateYear + '-' + dateMonth + '-' + dateDay + '.db'

      const options = {
        defaultPath: exportFileName,
        filters: [
          {
            name: 'Database File',
            extensions: ['db']
          }
        ]
      }

      dialog.showSaveDialog(options).then((response) => {
        if (response.canceled || response.filePath === '') {
          // User canceled the save dialog
          return
        }

        const filePath = response.filePath

        fs.readFile(historyDb, (readErr, data) => {
          if (readErr) {
            const message = this.$t('Settings.Data Settings.Unable to read file')
            this.showToast({
              message: `${message}: ${readErr}`
            })
            return
          }

          fs.writeFile(filePath, data, (writeErr) => {
            if (writeErr) {
              const message = this.$t('Settings.Data Settings.Unable to write file')
              this.showToast({
                message: `${message}: ${writeErr}`
              })
              return
            }

            this.showToast({
              message: this.$t('Settings.Data Settings.All watched history has been successfully exported')
            })
          })
        })
      })
    },

    async convertOldFreeTubeFormatToNew(oldData) {
      const convertedData = []
      for (const channel of oldData) {
        for (const profile of channel.profile) {
          let index = convertedData.findIndex(p => p.name === profile.value)
          if (index === -1) { // profile doesn't exist yet
            const randomBgColor = await this.getRandomColor()
            const contrastyTextColor = await this.calculateColorLuminance(randomBgColor)
            convertedData.push({
              name: profile.value,
              bgColor: randomBgColor,
              textColor: contrastyTextColor,
              subscriptions: [],
              _id: channel._id
            })
            index = convertedData.length - 1
          }
          convertedData[index].subscriptions.push({
            id: channel.channelId,
            name: channel.channelName,
            thumbnail: channel.channelThumbnail
          })
        }
      }
      return convertedData
    },

    getChannelInfoInvidious: function (channelId) {
      return new Promise((resolve, reject) => {
        const subscriptionsPayload = {
          resource: 'channels',
          id: channelId,
          params: {}
        }

        this.invidiousAPICall(subscriptionsPayload).then((response) => {
          resolve(response)
        }).catch((err) => {
          console.log(err)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err.responseJSON.error}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err.responseJSON.error)
            }
          })

          if (this.backendFallback && this.backendPreference === 'invidious') {
            this.showToast({
              message: this.$t('Falling back to the local API')
            })
            resolve(this.getChannelInfoLocal(channelId))
          } else {
            resolve([])
          }
        })
      })
    },

    getChannelInfoLocal: function (channelId) {
      return new Promise((resolve, reject) => {
        ytch.getChannelInfo(channelId, 'latest').then(async (response) => {
          resolve(response)
        }).catch((err) => {
          console.log(err)
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err)
            }
          })

          if (this.backendFallback && this.backendPreference === 'local') {
            this.showToast({
              message: this.$t('Falling back to the Invidious API')
            })
            resolve(this.getChannelInfoInvidious(channelId))
          } else {
            resolve([])
          }
        })
      })
    },

    ...mapActions([
      'invidiousAPICall',
      'updateProfile',
      'updateShowProgressBar',
      'updateHistory',
      'showToast',
      'getRandomColor',
      'calculateColorLuminance'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
