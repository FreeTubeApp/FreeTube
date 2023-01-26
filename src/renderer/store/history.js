import { defineStore } from 'pinia'
import { DBHistoryHandlers } from '../../datastores/handlers/index'
export const useHistoryStore = defineStore('history', {
  state: () => {
    return {
      historyCache: []
    }
  },
  actions: {
    async grabHistory() {
      try {
        const results = await DBHistoryHandlers.find()
        this.historyCache = results
      } catch (errMessage) {
        console.error(errMessage)
      }
    },
    async updateHistory(record) {
      try {
        await DBHistoryHandlers.upsert(record)
        this.upsertToHistoryCache(record)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },
    async removeFromHistory(videoId) {
      try {
        await DBHistoryHandlers.delete(videoId)
        this.removeFromHistoryCacheById(videoId)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },
    async removeAllHistory({ commit }) {
      try {
        await DBHistoryHandlers.deleteAll()
        this.setHistoryCache([])
      } catch (errMessage) {
        console.error(errMessage)
      }
    },
    async updateWatchProgress({ videoId, watchProgress }) {
      try {
        await DBHistoryHandlers.updateWatchProgress(videoId, watchProgress)
        this.updateRecordWatchProgressInHistoryCache({ videoId, watchProgress })
      } catch (errMessage) {
        console.error(errMessage)
      }
    },
    compactHistory(_) {
      DBHistoryHandlers.persist()
    },
    setHistoryCache(historyCache) {
      this.historyCache = historyCache
    },
    hoistEntryToTopOfHistoryCache({ currentIndex, updatedEntry }) {
      this.historyCache.splice(currentIndex, 1)
      this.historyCache.unshift(updatedEntry)
    },
    upsertToHistoryCache(record) {
      const i = this.historyCache.findIndex((currentRecord) => {
        return record.videoId === currentRecord.videoId
      })

      if (i !== -1) {
        // Already in cache
        // Must be hoisted to top, remove it and then unshift it
        this.historyCache.splice(i, 1)
      }

      this.historyCache.unshift(record)
    },

    updateRecordWatchProgressInHistoryCache({ videoId, watchProgress }) {
      const i = this.historyCache.findIndex((currentRecord) => {
        return currentRecord.videoId === videoId
      })

      const targetRecord = Object.assign({}, this.historyCache[i])
      targetRecord.watchProgress = watchProgress
      this.historyCache.splice(i, 1, targetRecord)
    },

    removeFromHistoryCacheById(videoId) {
      for (let i = 0; i < this.historyCache.length; i++) {
        if (this.historyCache[i].videoId === videoId) {
          this.historyCache.splice(i, 1)
          break
        }
      }
    }
  }
})
