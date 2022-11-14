import ytdl from 'ytdl-core'
import ytsr from 'ytsr'
import ytpl from 'ytpl'

import { SocksProxyAgent } from 'socks-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'

import i18n from '../../i18n/index'
import { searchFiltersMatch } from '../../helpers/utils'

const state = {
  isYtSearchRunning: false
}

const getters = {}

function createProxyAgent(protocol, hostname, port) {
  switch (protocol) {
    case 'http':
      return new HttpProxyAgent({
        host: hostname,
        port: port
      })
    case 'https':
      return new HttpsProxyAgent({
        host: hostname,
        port: port
      })
    case 'socks4':
      return new SocksProxyAgent({
        hostname: hostname,
        port: port,
        type: 4
      })
    case 'socks5':
      return new SocksProxyAgent({
        hostname: hostname,
        port: port,
        type: 5
      })
  }
}

const actions = {
  ytSearch ({ commit, dispatch, rootState }, payload) {
    return new Promise((resolve, reject) => {
      if (state.isYtSearchRunning) {
        resolve(false)
      }

      if (typeof payload.options.nextpageRef !== 'undefined') {
        const continuation = payload.options.nextpageRef
        const nextPageResults = ytsr.continueReq(continuation)
        resolve(nextPageResults)
        return
      }

      const defaultFilters = {
        sortBy: 'relevance',
        time: '',
        type: 'all',
        duration: ''
      }

      const settings = rootState.settings

      if (settings.useProxy) {
        const agent = createProxyAgent(settings.proxyProtocol, settings.proxyHostname, settings.proxyPort)

        payload.options.requestOptions = { agent }
      }

      commit('toggleIsYtSearchRunning')

      if (!searchFiltersMatch(defaultFilters, rootState.utils.searchSettings)) {
        dispatch('ytSearchGetFilters', payload).then((filter) => {
          if (typeof (payload.options.nextpageRef) === 'undefined' && filter !== payload.query) {
            payload.options.nextpageRef = filter
          }

          const query = filter || payload.query

          ytsr(query, payload.options).then((result) => {
            resolve(result)
          }).catch((err) => {
            console.error(err)
            reject(err)
          }).finally(() => {
            commit('toggleIsYtSearchRunning')
          })
        }).catch((err) => {
          console.error(err)
          commit('toggleIsYtSearchRunning')
          reject(err)
        })
      } else {
        ytsr(payload.query, payload.options).then((result) => {
          resolve(result)
        }).catch((err) => {
          console.error(err)
          reject(err)
        }).finally(() => {
          commit('toggleIsYtSearchRunning')
        })
      }
    })
  },

  async ytSearchGetFilters ({ rootState }, payload) {
    let options = null
    let agent = null
    const settings = rootState.settings

    if (settings.useProxy) {
      agent = createProxyAgent(settings.proxyProtocol, settings.proxyHostname, settings.proxyPort)
    }

    options = {
      requestOptions: { agent }
    }

    let filter = await ytsr.getFilters(payload.query, options)
    let filterUrl = null
    let searchSettings = payload.searchSettings

    if (typeof (searchSettings) === 'undefined') {
      searchSettings = rootState.utils.searchSettings
    }

    if (searchSettings.sortBy !== 'relevance') {
      let filterValue
      switch (searchSettings.sortBy) {
        case 'rating':
          filterValue = 'Rating'
          break
        case 'upload_date':
          filterValue = 'Upload date'
          break
        case 'view_count':
          filterValue = 'View count'
          break
      }
      filterUrl = filter.get('Sort by').get(filterValue).url
      filter = await ytsr.getFilters(filterUrl, options)
    }

    if (searchSettings.duration !== '') {
      let filterValue = null
      if (searchSettings.duration === 'short') {
        filterValue = 'Under 4 minutes'
      } else if (searchSettings.duration === 'long') {
        filterValue = 'Over 20 minutes'
      }

      filterUrl = filter.get('Duration').get(filterValue).url
      filter = await ytsr.getFilters(filterUrl, options)
    }

    if (searchSettings.time !== '') {
      let filterValue = null

      switch (searchSettings.time) {
        case 'hour':
          filterValue = 'Last hour'
          break
        case 'today':
          filterValue = 'Today'
          break
        case 'week':
          filterValue = 'This week'
          break
        case 'month':
          filterValue = 'This month'
          break
        case 'year':
          filterValue = 'This year'
          break
      }

      filterUrl = filter.get('Upload date').get(filterValue).url
      filter = await ytsr.getFilters(filterUrl, options)
    }

    if (searchSettings.type !== 'all') {
      const filterValue = searchSettings.type.charAt(0).toUpperCase() + searchSettings.type.slice(1)
      filterUrl = filter.get('Type').get(filterValue).url
      filter = await ytsr.getFilters(filterUrl, options)
    }

    return new Promise((resolve, reject) => {
      resolve(filterUrl)
    })
  },

  ytGetPlaylistInfo ({ rootState }, playlistId) {
    return new Promise((resolve, reject) => {
      let agent = null
      const settings = rootState.settings

      if (settings.useProxy) {
        agent = createProxyAgent(settings.proxyProtocol, settings.proxyHostname, settings.proxyPort)
      }
      let locale = i18n.locale.replace('_', '-')

      if (locale === 'nn') {
        locale = 'no'
      }

      ytpl(playlistId, {
        hl: locale,
        limit: Infinity,
        requestOptions: { agent }
      }).then((result) => {
        resolve(result)
      }).catch((err) => {
        reject(err)
      })
    })
  },

  ytGetVideoInformation ({ rootState }, videoId) {
    return new Promise((resolve, reject) => {
      let agent = null
      const settings = rootState.settings

      if (settings.useProxy) {
        agent = createProxyAgent(settings.proxyProtocol, settings.proxyHostname, settings.proxyPort)
      }

      ytdl.getInfo(videoId, {
        lang: 'en-US',
        requestOptions: { agent }
      }).then((result) => {
        resolve(result)
      }).catch((err) => {
        reject(err)
      })
    })
  }
}

const mutations = {
  toggleIsYtSearchRunning (state) {
    state.isYtSearchRunning = !state.isYtSearchRunning
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
