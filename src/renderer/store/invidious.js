import { defineStore } from 'pinia'
import fs from 'fs/promises'
import { pathExists } from '../../helpers/filesystem'

export const useInvidiousStore = defineStore('invidious', {
  state: () => {
    return {
      currentInvidiousInstance: '',
      invidiousInstancesList: null
    }
  },
  actions: {
    async fetchInvidiousInstances() {
      const requestUrl = 'https://api.invidious.io/instances.json'
      let instances = []
      try {
        const response = await fetch(requestUrl)
        const json = await response.json()
        instances = json.filter((instance) => {
          return !(instance[0].includes('.onion') ||
            instance[0].includes('.i2p') ||
            !instance[1].api ||
            (!process.env.IS_ELECTRON && !instance[1].cors))
        }).map((instance) => {
          return instance[1].uri.replace(/\/$/, '')
        })
      } catch (err) {
        console.error(err)
      }
      // If the invidious instance fetch isn't returning anything interpretable
      if (instances.length === 0) {
        // Fallback: read from static file
        const fileName = 'invidious-instances.json'
        /* eslint-disable-next-line n/no-path-concat */
        const fileLocation = process.env.NODE_ENV === 'development' ? './static/' : `${__dirname}/static/`
        if (await pathExists(`${fileLocation}${fileName}`)) {
          console.warn('reading static file for invidious instances')
          const fileData = await fs.readFile(`${fileLocation}${fileName}`)
          instances = JSON.parse(fileData).map((entry) => {
            return entry.url
          })
        }
      }
      this.invidiousInstancesList = instances
    },
    setRandomCurrentInvidiousInstance() {
      const instanceList = this.invidiousInstancesList
      const randomIndex = Math.floor(Math.random() * instanceList.length)
      this.setRandomCurrentInvidiousInstance(instanceList[randomIndex])
    },
    setCurrentInvidiousInstance(value) {
      this.currentInvidiousInstance = value
    },

    setInvidiousInstancesList(value) {
      this.invidiousInstancesList = value
    }
  }
})
