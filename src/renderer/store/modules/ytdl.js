import ytdl from 'ytdl-core'
import ytsr from 'ytsr'
import ytpl from 'ytpl'
import IsEqual from 'lodash.isequal'

import { returnProxyAgent } from '../../helpers'

const state = {
  main: 0,
  isYtSearchRunning: false
}

const getters = {
  getMain ({ state }) {
    return state.main
  }
}

const actions = {
  ytSearch ({ commit, dispatch, rootState }, payload) {
    console.log('Performing search please wait...')
    if (state.isYtSearchRunning) {
      console.log('search is running. please try again')
      return Promise.resolve(false)
    }

    if (typeof payload.options.nextpageRef !== 'undefined') {
      const continuation = payload.options.nextpageRef
      return ytsr.continueReq(continuation)
    }

    commit('toggleIsYtSearchRunning')

    const defaultFilters = {
      sortBy: 'relevance',
      time: '',
      type: 'all',
      duration: ''
    }

    payload.options.requestOptions = {
      agent: returnProxyAgent(rootState.settings)
    }

    if (!IsEqual(defaultFilters, rootState.utils.searchSettings)) {
      return dispatch('ytSearchGetFilters', payload)
        .then(filter => {
          if (typeof (payload.options.nextpageRef) === 'undefined' && filter !== payload.query) {
            payload.options.nextpageRef = filter
          }

          const query = filter || payload.query

          return ytsr(query, payload.options)
        })
        .then(result => {
          console.log(result)
          console.log('done')
          commit('toggleIsYtSearchRunning')
          return result
        })
        .catch(error => {
          console.log(error)
          commit('toggleIsYtSearchRunning')
          throw error
        })
    } else {
      return ytsr(payload.query, payload.options)
        .then(result => {
          console.log(result)
          console.log('done')
          commit('toggleIsYtSearchRunning')
          return result
        }).catch(error => {
          console.log(error)
          commit('toggleIsYtSearchRunning')
          throw error
        })
    }
  },

  async ytSearchGetFilters ({ rootState }, payload) {
    const options = {
      requestOptions: {
        agent: returnProxyAgent(rootState.settings)
      }
    }

    let filter = await ytsr.getFilters(payload.query, options)
    let filterUrl = null
    let searchSettings = payload.searchSettings

    if (typeof (searchSettings) === 'undefined') {
      searchSettings = rootState.utils.searchSettings
    }

    console.log(searchSettings)
    console.log(filter)

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

    console.log(`Current ref: ${filterUrl}`)

    if (searchSettings.duration !== '') {
      let filterValue = null
      if (searchSettings.duration === 'short') {
        filterValue = 'Short (< 4 minutes)'
      } else if (searchSettings.duration === 'long') {
        filterValue = 'Long (> 20 minutes)'
      }

      filterUrl = filter.get('Duration').get(filterValue).url
      filter = await ytsr.getFilters(filterUrl, options)
    }

    console.log(`Current ref: ${filterUrl}`)

    if (searchSettings.time !== '') {
      let filterValue = null

      switch (searchSettings.time) {
        case 'hour':
          filterValue = 'Last Hour'
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

    console.log(`Current ref: ${filterUrl}`)

    if (searchSettings.type !== 'all') {
      const filterValue = searchSettings.type.charAt(0).toUpperCase() + searchSettings.type.slice(1)
      filterUrl = filter.get('Type').get(filterValue).url
      filter = await ytsr.getFilters(filterUrl, options)
    }

    console.log(`Current ref: ${filterUrl}`)

    return filterUrl
  },

  ytGetPlaylistInfo ({ rootState: { settings } }, playlistId) {
    console.log(playlistId)
    console.log('Getting playlist info please wait...')
    return ytpl(playlistId, {
      limit: 'Infinity',
      requestOptions: {
        agent: returnProxyAgent(settings)
      }
    })
  },

  ytGetVideoInformation ({ rootState: { settings } }, videoId) {
    console.log('Getting video info please wait...')

    return ytdl.getInfo(videoId, {
      lang: localStorage.getItem('locale'),
      requestOptions: {
        agent: returnProxyAgent(settings)
      }
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
