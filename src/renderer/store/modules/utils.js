import IsEqual from 'lodash.isequal'
import FtToastEvents from '../../components/ft-toast/ft-toast-events'
const state = {
  isSideNavOpen: false,
  sessionSearchHistory: [],
  popularCache: null,
  trendingCache: null,
  showProgressBar: false,
  progressBarPercentage: 0,
  searchSettings: {
    sortBy: 'relevance',
    time: '',
    type: 'all',
    duration: ''
  },
  colorClasses: [
    'mainRed',
    'mainPink',
    'mainPurple',
    'mainDeepPurple',
    'mainIndigo',
    'mainBlue',
    'mainLightBlue',
    'mainCyan',
    'mainTeal',
    'mainGreen',
    'mainLightGreen',
    'mainLime',
    'mainYellow',
    'mainAmber',
    'mainOrange',
    'mainDeepOrange'
  ],
  colorValues: [
    '#d50000',
    '#C51162',
    '#AA00FF',
    '#6200EA',
    '#304FFE',
    '#2962FF',
    '#0091EA',
    '#00B8D4',
    '#00BFA5',
    '#00C853',
    '#64DD17',
    '#AEEA00',
    '#FFD600',
    '#FFAB00',
    '#FF6D00',
    '#DD2C00'
  ]
}

const getters = {
  getIsSideNavOpen () {
    return state.isSideNavOpen
  },

  getCurrentVolume () {
    return state.currentVolume
  },

  getSessionSearchHistory () {
    return state.sessionSearchHistory
  },

  getPopularCache () {
    return state.popularCache
  },

  getTrendingCache () {
    return state.trendingCache
  },

  getSearchSettings () {
    return state.searchSettings
  },

  getColorValues () {
    return state.colorValues
  },

  getShowProgressBar () {
    return state.showProgressBar
  },

  getProgressBarPercentage () {
    return state.progressBarPercentage
  }
}

const actions = {
  updateShowProgressBar ({ commit }, value) {
    commit('setShowProgressBar', value)
  },

  getRandomColorClass () {
    const randomInt = Math.floor(Math.random() * state.colorClasses.length)
    return state.colorClasses[randomInt]
  },

  getRandomColor () {
    const randomInt = Math.floor(Math.random() * state.colorValues.length)
    return state.colorValues[randomInt]
  },

  calculateColorLuminance (_, colorValue) {
    const cutHex = colorValue.substring(1, 7)
    const colorValueR = parseInt(cutHex.substring(0, 2), 16)
    const colorValueG = parseInt(cutHex.substring(2, 4), 16)
    const colorValueB = parseInt(cutHex.substring(4, 6), 16)

    const luminance = (0.299 * colorValueR + 0.587 * colorValueG + 0.114 * colorValueB) / 255

    if (luminance > 0.5) {
      return '#000000'
    } else {
      return '#FFFFFF'
    }
  },

  calculatePublishedDate(_, publishedText) {
    const date = new Date()

    if (publishedText === 'Live') {
      return publishedText
    }

    const textSplit = publishedText.split(' ')

    if (textSplit[0].toLowerCase() === 'streamed') {
      textSplit.shift()
    }

    const timeFrame = textSplit[1]
    const timeAmount = parseInt(textSplit[0])
    let timeSpan = null

    if (timeFrame.indexOf('second') > -1) {
      timeSpan = timeAmount * 1000
    } else if (timeFrame.indexOf('minute') > -1) {
      timeSpan = timeAmount * 60000
    } else if (timeFrame.indexOf('hour') > -1) {
      timeSpan = timeAmount * 3600000
    } else if (timeFrame.indexOf('day') > -1) {
      timeSpan = timeAmount * 86400000
    } else if (timeFrame.indexOf('week') > -1) {
      timeSpan = timeAmount * 604800000
    } else if (timeFrame.indexOf('month') > -1) {
      timeSpan = timeAmount * 2592000000
    } else if (timeFrame.indexOf('year') > -1) {
      timeSpan = timeAmount * 31556952000
    }

    return date.getTime() - timeSpan
  },

  getVideoIdFromUrl (_, url) {
    /** @type {URL} */
    let urlObject
    try {
      urlObject = new URL(url)
    } catch (e) {
      return false
    }

    const extractors = [
      // anything with /watch?v=
      function() {
        if (urlObject.pathname === '/watch' && urlObject.searchParams.has('v')) {
          return urlObject.searchParams.get('v')
        }
      },
      // youtu.be
      function() {
        if (urlObject.host === 'youtu.be' && urlObject.pathname.match(/^\/[A-Za-z0-9_-]+$/)) {
          return urlObject.pathname.slice(1)
        }
      },
      // cloudtube
      function() {
        if (urlObject.host.match(/^cadence\.(gq|moe)$/) && urlObject.pathname.match(/^\/cloudtube\/video\/[A-Za-z0-9_-]+$/)) {
          return urlObject.pathname.slice('/cloudtube/video/'.length)
        }
      }
    ]

    return extractors.reduce((a, c) => a || c(), null) || false
  },

  padNumberWithLeadingZeros(_, payload) {
    let numberString = payload.number.toString()
    while (numberString.length < payload.length) {
      numberString = '0' + numberString
    }
    return numberString
  },

  async buildVTTFileLocally ({ dispatch }, Storyboard) {
    let vttString = 'WEBVTT\n\n'
    // how many images are in one image
    const numberOfSubImagesPerImage = Storyboard.sWidth * Storyboard.sHeight
    // the number of storyboard images
    const numberOfImages = Math.ceil(Storyboard.count / numberOfSubImagesPerImage)
    const intervalInSeconds = Storyboard.interval / 1000
    let currentUrl = Storyboard.url
    let startHours = 0
    let startMinutes = 0
    let startSeconds = 0
    let endHours = 0
    let endMinutes = 0
    let endSeconds = intervalInSeconds
    for (let i = 0; i < numberOfImages; i++) {
      let xCoord = 0
      let yCoord = 0
      for (let j = 0; j < numberOfSubImagesPerImage; j++) {
        // add the timestamp information
        const paddedStartHours = await dispatch('padNumberWithLeadingZeros', {
          number: startHours,
          length: 2
        })
        const paddedStartMinutes = await dispatch('padNumberWithLeadingZeros', {
          number: startMinutes,
          length: 2
        })
        const paddedStartSeconds = await dispatch('padNumberWithLeadingZeros', {
          number: startSeconds,
          length: 2
        })
        const paddedEndHours = await dispatch('padNumberWithLeadingZeros', {
          number: endHours,
          length: 2
        })
        const paddedEndMinutes = await dispatch('padNumberWithLeadingZeros', {
          number: endMinutes,
          length: 2
        })
        const paddedEndSeconds = await dispatch('padNumberWithLeadingZeros', {
          number: endSeconds,
          length: 2
        })
        vttString += `${paddedStartHours}:${paddedStartMinutes}:${paddedStartSeconds}.000 --> ${paddedEndHours}:${paddedEndMinutes}:${paddedEndSeconds}.000\n`
        // add the current image url as well as the x, y, width, height information
        vttString += currentUrl + `#xywh=${xCoord},${yCoord},${Storyboard.width},${Storyboard.height}\n\n`
        // update the variables
        startHours = endHours
        startMinutes = endMinutes
        startSeconds = endSeconds
        endSeconds += intervalInSeconds
        if (endSeconds >= 60) {
          endSeconds -= 60
          endMinutes += 1
        }
        if (endMinutes >= 60) {
          endMinutes -= 60
          endHours += 1
        }
        // x coordinate can only be smaller than the width of one subimage * the number of subimages per row
        xCoord = (xCoord + Storyboard.width) % (Storyboard.width * Storyboard.sWidth)
        // only if the x coordinate is , so in a new row, we have to update the y coordinate
        if (xCoord === 0) {
          yCoord += Storyboard.height
        }
      }
      // make sure that there is no value like M0 or M1 in the parameters that gets replaced
      currentUrl = currentUrl.replace('M' + i.toString() + '.jpg', 'M' + (i + 1).toString() + '.jpg')
    }
    return vttString
  },

  toLocalePublicationString ({ dispatch }, payload) {
    if (payload.isLive) {
      return '0' + payload.liveStreamString
    } else if (payload.isUpcoming || payload.publishText === null) {
      // the check for null is currently just an inferring of knowledge, because there is no other possibility left
      return payload.upcomingString
    } else if (payload.isRSS) {
      return payload.publishText
    }
    const strings = payload.publishText.split(' ')
    // filters out the streamed x hours ago and removes the streamed in order to keep the rest of the code working
    if (strings[0].toLowerCase() === 'streamed') {
      strings.shift()
    }
    const singular = (strings[0] === '1')
    let publicationString = payload.templateString.replace('$', strings[0])
    switch (strings[1].substring(0, 2)) {
      case 'se':
        if (singular) {
          publicationString = publicationString.replace('%', payload.timeStrings.Second)
        } else {
          publicationString = publicationString.replace('%', payload.timeStrings.Seconds)
        }
        break
      case 'mi':
        if (singular) {
          publicationString = publicationString.replace('%', payload.timeStrings.Minute)
        } else {
          publicationString = publicationString.replace('%', payload.timeStrings.Minutes)
        }
        break
      case 'ho':
        if (singular) {
          publicationString = publicationString.replace('%', payload.timeStrings.Hour)
        } else {
          publicationString = publicationString.replace('%', payload.timeStrings.Hours)
        }
        break
      case 'da':
        if (singular) {
          publicationString = publicationString.replace('%', payload.timeStrings.Day)
        } else {
          publicationString = publicationString.replace('%', payload.timeStrings.Days)
        }
        break
      case 'we':
        if (singular) {
          publicationString = publicationString.replace('%', payload.timeStrings.Week)
        } else {
          publicationString = publicationString.replace('%', payload.timeStrings.Weeks)
        }
        break
      case 'mo':
        if (singular) {
          publicationString = publicationString.replace('%', payload.timeStrings.Month)
        } else {
          publicationString = publicationString.replace('%', payload.timeStrings.Months)
        }
        break
      case 'ye':
        if (singular) {
          publicationString = publicationString.replace('%', payload.timeStrings.Year)
        } else {
          publicationString = publicationString.replace('%', payload.timeStrings.Years)
        }
        break
    }
    return publicationString
  },

  clearSessionSearchHistory ({ commit }) {
    commit('setSessionSearchHistory', [])
  },

  showToast (_, payload) {
    FtToastEvents.$emit('toast.open', payload.message, payload.action, payload.time)
  }
}

const mutations = {
  toggleSideNav (state) {
    state.isSideNavOpen = !state.isSideNavOpen
  },

  setShowProgressBar (state, value) {
    state.showProgressBar = value
  },

  setProgressBarPercentage (state, value) {
    state.progressBarPercentage = value
  },

  setSessionSearchHistory (state, history) {
    state.sessionSearchHistory = history
  },

  addToSessionSearchHistory (state, payload) {
    const sameSearch = state.sessionSearchHistory.findIndex((search) => {
      return search.query === payload.query && IsEqual(payload.searchSettings, search.searchSettings)
    })

    if (sameSearch !== -1) {
      state.sessionSearchHistory[sameSearch].data = state.sessionSearchHistory[sameSearch].data.concat(payload.data)
      state.sessionSearchHistory[sameSearch].nextPageRef = payload.nextPageRef
    } else {
      state.sessionSearchHistory.push(payload)
    }
  },

  setPopularCache (state, value) {
    state.popularCache = value
  },

  setTrendingCache (state, value) {
    state.trendingCache = value
  },

  setSearchSortBy (state, value) {
    state.searchSettings.sortBy = value
  },

  setSearchTime (state, value) {
    state.searchSettings.time = value
  },

  setSearchType (state, value) {
    state.searchSettings.type = value
  },

  setSearchDuration (state, value) {
    state.searchSettings.duration = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
