import i18n from '../../i18n/index'

import {
  replaceFilenameForbiddenChars,
  showToast
} from '../../helpers/utils'

const state = {
  entries: [], /*
    title: String
    items: [
      {
        mime: String
        url: String
        dl: {
          res: Response  // fetch() response
          responseStream: Response(Stream)
          totalSize: Integer  // this item size
          loadedSize: Integer
          progress: Integer  // 0-100
          status: String (preparing/downloading/complete/failed)
          reader: Reader
          stream: Stream
          blob: Blob
          mediaInput: mediabunny.Input
        }
      }
    ]
    dl {
      totalSize: Integer  // sum of all items to download
      loadedSize: Integer
      progress: Integer  // 0-100
      status: String (preparing/downloading/complete/failed/muxing/aborted)
      mediaOutput: mediabunny.Output
    }
    fileHandle: FileSystemFileHandle
    fileFormat: String // 'MP4' or 'MKV', deduced from output filename
    worker: Worker
  */
}

const getters = {

  downloadsEntries: (state) => {
    return state.entries
  },

}
const actions = {

  async createNewDownload({ commit }, entry) {
    try {
      const fileExt = 'mp4'
      const fileName = `${replaceFilenameForbiddenChars(entry.title)}.${fileExt}`

      const mimeMp4 = 'video/mp4'
      const mimeMkv = 'video/matroska'

      try {
        entry.fileHandle = await window.showSaveFilePicker({
          excludeAcceptAllOption: true,
          id: 'downloads',
          startIn: 'downloads',
          suggestedName: fileName,
          types: [{
            accept: {
              [mimeMp4]: ['.mp4'],
              [mimeMkv]: ['.mkv'],
            }
          }]
        })
      } catch (errMsg) {
        // user pressed cancel in the file picker
        if (errMsg.name === 'AbortError') {
          return
        }

        console.error(errMsg)
        showToast(i18n.t('Downloading failed', { videoTitle: entry.title }))
        return
      }

      entry.dl = { }
      entry.dl.status = 'preparing'
      entry.dl.progress = 0
      entry.dl.totalSize = 0
      entry.dl.loadedSize = 0

      for (const item of entry.items) {
        item.dl = { }
        item.dl.status = 'preparing'
        item.dl.progress = 0
        item.dl.totalSize = 0
        item.dl.loadedSize = 0
      }

      entry.abort = () => {
        entry.dl.status = 'aborted'
        if (entry.fileHandle) {
          entry.fileHandle.remove()
        }
      }
      entry.failed = () => {
        entry.dl.status = 'failed'
        if (entry.fileHandle) {
          entry.fileHandle.remove()
        }
      }
      entry.cleanup = () => {
        for (const item of entry.items) {
          item.dl.blob = null
        }
      }

      commit('submitNewDownload', entry)

      const filename = entry.fileHandle.name.toLowerCase()
      if (filename.endsWith('.mkv')) {
        entry.fileFormat = 'MKV'
      } else if (filename.endsWith('.mp4')) {
        entry.fileFormat = 'MP4'
      } else {
        console.error('unable to detect output format for "' + entry.fileHandle.name + '"')
        showToast(i18n.t('Downloading failed', { videoTitle: entry.title }))
        entry.cleanup()
        entry.failed()
        return
      }

      for (const item of entry.items) {
        try {
          item.dl.status = 'downloading'
          item.dl.res = await fetch(item.url)
          if (item.dl.res.ok) {
            const contentLength = item.dl.res.headers.get('content-length')
            item.dl.totalSize = (contentLength ? parseInt(contentLength, 10) : 0)
            item.dl.reader = item.dl.res.body.getReader()

            entry.dl.totalSize += item.dl.totalSize
            // console.log('total size of "' + item.url + '": ' + item.dl.totalSize)
          } else {
            console.error('failed to fetch: "' + item.url + '"')
            showToast(i18n.t('Downloading failed', { videoTitle: entry.title }))
            entry.cleanup()
            entry.failed()
            return
          }
        } catch (errMsg) {
          console.error(errMsg)
          showToast(i18n.t('Downloading failed', { videoTitle: entry.title }))
          entry.cleanup()
          entry.failed()
          return
        }
      }

      entry.dl.status = 'downloading'
      showToast(i18n.t('Starting download', { videoTitle: entry.title }))

      for (const item of entry.items) {
        // console.log('downloading item ' + item.url)

        item.dl.stream = new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await item.dl.reader.read()
              if (done) {
                // console.log('item down loading is done')
                break
              }
              if (entry.dl.status === 'aborted') {
                controller.close()
                break
              }

              // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
              // await delay(20);

              entry.dl.loadedSize += value.length
              const entryProgress = entry.dl.totalSize
                ? Math.ceil(entry.dl.loadedSize / entry.dl.totalSize * 100)
                : 0

              if (entry.dl.progress < entryProgress && entryProgress < 100) {
                entry.dl.progress = entryProgress
              }

              item.dl.loadedSize += value.length
              item.dl.progress = item.dl.totalSize
                ? Math.ceil(item.dl.loadedSize / item.dl.totalSize * 100)
                : 0

              // console.log('progress[' + item.url + ']: ' + item.dl.progress +
              //  '(' + entry.dl.progress + ')')

              controller.enqueue(value)
            }
            controller.close()
          },
        })

        try {
          item.dl.responseStream = new Response(item.dl.stream)
          item.dl.blob = await item.dl.responseStream.blob()
        } catch (errMsg) {
          console.error(errMsg)
          item.dl.status = 'failed'
          entry.dl.status = 'failed'
          entry.cleaup()
          entry.failed()
          break
        }
      }

      if ((entry.dl.status === 'failed') || (entry.dl.status === 'aborted')) {
        return
      }

      const workerEntry = {}
      workerEntry.dl = {}
      workerEntry.fileHandle = entry.fileHandle
      workerEntry.fileFormat = entry.fileFormat
      workerEntry.items = []

      for (const item of entry.items) {
        const workerItem = {}
        workerItem.dl = {}
        workerItem.dl.blob = item.dl.blob
        workerItem.mime = item.mime
        workerEntry.items.push(workerItem)
      }

      // at this point all data blobs is already referenced in workerItem
      entry.cleanup()

      entry.worker = new Worker(new URL('./downloads-worker.js', import.meta.url))
      entry.worker.postMessage({ entry: workerEntry })
      entry.worker.onmessage = ({ data: { status } }) => {
        entry.dl.status = status
        if (status === 'failed') {
          entry.fileHandle.remove()
        }
      }
    } catch (errMsg) {
      console.error(errMsg)
      if (entry.dl) {
        entry.dl.status = 'failed'
      }
      if (entry.fileHandle) {
        entry.fileHandle.remove()
      }
    }
  },

  async cancelDownload({ commit }, index) {
    try {
      commit('cancelDownload', index)
    } catch (errMsg) {
      console.error(errMsg)
    }
  },

}

const mutations = {

  submitNewDownload(state, entry) {
    state.entries.unshift(entry)
  },

  cancelDownload(state, index) {
    if (index >= 0 && index < state.entries.length) {
      const entry = state.entries[index]
      state.entries.splice(index, 1)

      // console.log('removed downloads entry')
      entry.cleanup()
      entry.abort()
    }
  },

}

export default {
  state,
  getters,
  actions,
  mutations
}
