import { Innertube } from 'youtubei.js'
import { ClientType } from 'youtubei.js/dist/src/core/Session'
import EmojiRun from 'youtubei.js/dist/src/parser/classes/misc/EmojiRun'
import Text from 'youtubei.js/dist/src/parser/classes/misc/Text'
import Autolinker from 'autolinker'
import { join } from 'path'

import { PlayerCache } from './PlayerCache'
import {
  extractNumberFromString,
  getUserDataPath,
  toLocalePublicationString
} from '../utils'

/**
 * Creates a lightweight Innertube instance, which is faster to create or
 * an instance that can decode the streaming URLs, which is slower to create
 * the lightweight one only needs a single web request to create the new session
 * the full one needs 3 (or 2 if the player is cached) web requests to create:
 * 1. the request for the session
 * 2. fetch a page that contains a link to the player
 * 3. if the player isn't cached, it is downloaded and transformed
 * @param {object} options
 * @param {boolean} options.withPlayer set to true to get an Innertube instance that can decode the streaming URLs
 * @param {string|undefined} options.location the geolocation to pass to YouTube get different content
 * @param {boolean} options.safetyMode whether to hide mature content
 * @param {string} options.clientType use an alterate client
 * @returns the Innertube instance
 */
async function createInnertube(options = { withPlayer: false, location: undefined, safetyMode: false, clientType: undefined }) {
  let cache
  if (options.withPlayer) {
    const userData = await getUserDataPath()
    cache = new PlayerCache(join(userData, 'player_cache'))
  }

  return await Innertube.create({
    retrieve_player: !!options.withPlayer,
    location: options.location,
    enable_safety_mode: !!options.safetyMode,
    client_type: options.clientType,

    // use browser fetch
    fetch: (input, init) => fetch(input, init),
    cache,
    generate_session_locally: true
  })
}

let searchSuggestionsSession = null

export async function getLocalSearchSuggestions(query) {
  // reuse innertube instance to keep the search suggestions snappy
  if (searchSuggestionsSession === null) {
    searchSuggestionsSession = await createInnertube()
  }

  return await searchSuggestionsSession.getSearchSuggestions(query)
}

export function clearLocalSearchSuggestionsSession() {
  searchSuggestionsSession = null
}

export async function getLocalPlaylist(id) {
  const innertube = await createInnertube()
  return await innertube.getPlaylist(id)
}

/**
 * @typedef {import('youtubei.js/dist/src/core/TabbedFeed').default} TabbedFeed
 */

/**
 * @param {string} location
 * @param {string} tab
 * @param {TabbedFeed|null} instance
 */
export async function getLocalTrending(location, tab, instance) {
  if (instance === null) {
    const innertube = await createInnertube({ location })
    instance = await innertube.getTrending()
  }

  // youtubei.js's tab names are localised, so we need to use the index to get tab name that youtubei.js expects
  const tabIndex = ['default', 'music', 'gaming', 'movies'].indexOf(tab)
  const resultsInstance = await instance.getTabByName(instance.tabs[tabIndex])

  const results = resultsInstance.videos
    .filter((video) => video.type === 'Video')
    .map(parseListVideo)

  return {
    results,
    instance: resultsInstance
  }
}

/**
 * @param {string} query
 * @param {object} filters
 * @param {boolean} safetyMode
 */
export async function getLocalSearchResults(query, filters, safetyMode) {
  const innertube = await createInnertube({ safetyMode })
  const response = await innertube.search(query, convertSearchFilters(filters))

  return handleSearchResponse(response)
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/youtube/Search').default} Search
 */

/**
 * @param {Search} continuationData
 */
export async function getLocalSearchContinuation(continuationData) {
  const response = await continuationData.getContinuation()

  return handleSearchResponse(response)
}

export async function getLocalVideoInfo(id, attemptBypass = false) {
  let info
  let player

  if (attemptBypass) {
    const innertube = await createInnertube({ withPlayer: true, clientType: ClientType.TV_EMBEDDED })
    player = innertube.actions.session.player

    // the second request that getInfo makes 404s with the bypass, so we use getBasicInfo instead
    // that's fine as we have most of the information from the original getInfo request
    info = await innertube.getBasicInfo(id, 'TV_EMBEDDED')
  } else {
    const innertube = await createInnertube({ withPlayer: true })
    player = innertube.actions.session.player

    info = await innertube.getInfo(id)
  }

  if (info.streaming_data) {
    decipherFormats(info.streaming_data.adaptive_formats, player)
    decipherFormats(info.streaming_data.formats, player)
  }

  return info
}

export async function getLocalComments(id, sortByNewest = false) {
  const innertube = await createInnertube()
  return innertube.getComments(id, sortByNewest ? 'NEWEST_FIRST' : 'TOP_COMMENTS')
}

/**
 * @param {import('youtubei.js/dist/src/parser/classes/misc/Format').default[]} formats
 * @param {import('youtubei.js/dist/index').Player} player
 */
function decipherFormats(formats, player) {
  for (const format of formats) {
    format.url = format.decipher(player)

    // set these to undefined so that toDash doesn't try to decipher them again, throwing an error
    format.cipher = undefined
    format.signature_cipher = undefined
  }
}

/**
 * @param {Search} response
 */
function handleSearchResponse(response) {
  if (!response.results) {
    return {
      results: [],
      continuationData: null
    }
  }

  const results = response.results
    .filter((item) => {
      return item.type === 'Video' || item.type === 'Channel' || item.type === 'Playlist'
    })
    .map((item) => parseListItem(item))

  return {
    results,
    continuationData: response.has_continuation ? response : null
  }
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/classes/PlaylistVideo').default} PlaylistVideo
 */

/**
 * @param {PlaylistVideo} video
 */
export function parseLocalPlaylistVideo(video) {
  return {
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds
  }
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/classes/Video').default} Video
 */

/**
 * @param {Video} video
 */
function parseListVideo(video) {
  return {
    type: 'video',
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    description: video.description,
    viewCount: extractNumberFromString(video.view_count.text),
    publishedText: video.published.text !== 'N/A' ? video.published.text : null,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds,
    liveNow: video.is_live,
    isUpcoming: video.is_upcoming || video.is_premiere,
    premiereDate: video.upcoming
  }
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/helpers').YTNode} YTNode
 * @typedef {import('youtubei.js/dist/src/parser/classes/Channel').default} Channel
 * @typedef {import('youtubei.js/dist/src/parser/classes/Playlist').default} Playlist
 */

/**
 * @param {YTNode} item
 */
function parseListItem(item) {
  switch (item.type) {
    case 'Video':
      return parseListVideo(item)
    case 'Channel': {
      /** @type {Channel} */
      const channel = item

      // see upstream TODO: https://github.com/LuanRT/YouTube.js/blob/main/src/parser/classes/Channel.ts#L33

      // according to https://github.com/iv-org/invidious/issues/3514#issuecomment-1368080392
      // the response can be the new or old one, so we currently need to handle both here
      let subscribers = null
      let videos = null
      let handle = null
      if (channel.subscribers.text.startsWith('@')) {
        handle = channel.subscribers.text

        if (channel.videos.text !== 'N/A') {
          subscribers = channel.videos.text
        }
      } else {
        videos = extractNumberFromString(channel.videos.text)

        if (channel.subscribers.text !== 'N/A') {
          subscribers = channel.subscribers.text
        }
      }

      return {
        type: 'channel',
        dataSource: 'local',
        thumbnail: channel.author.best_thumbnail?.url,
        name: channel.author.name,
        channelID: channel.author.id,
        subscribers,
        videos,
        handle,
        descriptionShort: channel.description_snippet.text
      }
    }
    case 'Playlist': {
      /** @type {Playlist} */
      const playlist = item

      let channelName
      let channelId = null

      if (playlist.author instanceof Text) {
        channelName = playlist.author.text
      } else {
        channelName = playlist.author.name
        channelId = playlist.author.id
      }

      return {
        type: 'playlist',
        dataSource: 'local',
        title: playlist.title,
        thumbnail: playlist.thumbnails[0].url,
        channelName,
        channelId,
        playlistId: playlist.id,
        videoCount: extractNumberFromString(playlist.video_count.text)
      }
    }
  }
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/classes/CompactVideo').default} CompactVideo
 */

/**
 * @param {CompactVideo} video
 */
export function parseLocalWatchNextVideo(video) {
  return {
    type: 'video',
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    viewCount: extractNumberFromString(video.view_count.text),
    // CompactVideo doesn't have is_live, is_upcoming or is_premiere,
    // so we have to make do with this for the moment, to stop toLocalePublicationString erroring
    publishedText: video.published.text === 'N/A' ? null : video.published.text,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds
  }
}

function convertSearchFilters(filters) {
  const convertedFilters = {}

  // some of the fields have different names and
  // others have empty strings that we don't want to pass to youtubei.js

  if (filters) {
    if (filters.sortBy) {
      convertedFilters.sort_by = filters.sortBy
    }

    if (filters.time) {
      convertedFilters.upload_date = filters.time
    }

    if (filters.type) {
      convertedFilters.type = filters.type
    }

    if (filters.duration) {
      convertedFilters.type = filters.duration
    }
  }

  return convertedFilters
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/classes/misc/TextRun').default} TextRun
 */

/**
 * @param {(TextRun|EmojiRun)[]} runs
 * @param {number} emojiSize
 */
export function parseLocalTextRuns(runs, emojiSize = 16) {
  if (!Array.isArray(runs)) {
    throw new Error('not an array of text runs')
  }

  const timestampRegex = /^(?:\d+:){1,2}\d+$/
  const parsedRuns = []

  for (const run of runs) {
    if (run instanceof EmojiRun) {
      const { emoji, text } = run

      let altText

      if (emoji.is_custom) {
        if (emoji.shortcuts.length > 0) {
          altText = emoji.shortcuts[0]
        } else if (emoji.search_terms.length > 0) {
          altText = emoji.search_terms.join(', ')
        } else {
          altText = 'Custom emoji'
        }
      } else {
        altText = text
      }

      // lazy load the emoji image so it doesn't delay rendering of the text
      // by defining a height and width, that space is reserved until the image is loaded
      // that way we avoid layout shifts when it loads
      parsedRuns.push(`<img src="${emoji.image[0].url}" alt="${altText}" width="${emojiSize}" height="${emojiSize}" loading="lazy" style="vertical-align: middle">`)
    } else {
      const { text, bold, italics, strikethrough, endpoint } = run

      if (endpoint && !text.startsWith('#')) {
        switch (endpoint.metadata.page_type) {
          case 'WEB_PAGE_TYPE_WATCH':
            if (timestampRegex.test(text)) {
              parsedRuns.push(text)
            } else {
              parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            }
            break
          case 'WEB_PAGE_TYPE_CHANNEL': {
            const trimmedText = text.trim()
            if (trimmedText.startsWith('@')) {
              parsedRuns.push(`<a href="https://www.youtube.com/channel/${endpoint.payload.browseId}">${trimmedText}</a>`)
            } else {
              parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            }
            break
          }
          case 'WEB_PAGE_TYPE_PLAYLIST':
            parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            break
          case 'WEB_PAGE_TYPE_UNKNOWN':
          default: {
            const url = new URL(endpoint.payload.url)
            if (url.hostname === 'www.youtube.com' && url.pathname === '/redirect' && url.searchParams.has('q')) {
              // remove utm tracking parameters
              const realURL = new URL(url.searchParams.get('q'))

              realURL.searchParams.delete('utm_source')
              realURL.searchParams.delete('utm_medium')
              realURL.searchParams.delete('utm_campaign')
              realURL.searchParams.delete('utm_term')
              realURL.searchParams.delete('utm_content')

              parsedRuns.push(realURL.toString())
            } else {
              // this is probably a special YouTube URL like http://www.youtube.com/approachingnirvana
              parsedRuns.push(endpoint.payload.url)
            }
            break
          }
        }
      } else {
        let formattedText = text
        if (bold) {
          formattedText = `<b>${formattedText}</b>`
        }

        if (italics) {
          formattedText = `<i>${formattedText}</i>`
        }

        if (strikethrough) {
          formattedText = `<s>${formattedText}</s>`
        }

        parsedRuns.push(formattedText)
      }
    }
  }

  return parsedRuns.join('')
}

/**
 * @typedef {import('youtubei.js/dist/src/parser/classes/misc/Format').default} Format
 */

/**
 * @param {Format} format
 */
export function mapLocalFormat(format) {
  return {
    itag: format.itag,
    qualityLabel: format.quality_label,
    fps: format.fps,
    bitrate: format.bitrate,
    mimeType: format.mime_type,
    height: format.height,
    url: format.url
  }
}

/**
 * @param {import('youtubei.js/dist/src/parser/classes/comments/Comment').default} comment
 * @param {import('youtubei.js/dist/src/parser/classes/comments/CommentThread').default} commentThread
 */
export function parseLocalComment(comment, commentThread = undefined) {
  let hasOwnerReplied = false
  let replyToken = null

  if (commentThread?.has_replies) {
    hasOwnerReplied = commentThread.comment_replies_data.has_channel_owner_replied
    replyToken = commentThread
  }

  return {
    dataType: 'local',
    authorLink: comment.author.id,
    author: comment.author.name,
    authorThumb: comment.author.best_thumbnail.url,
    isPinned: comment.is_pinned,
    isOwner: comment.author_is_channel_owner,
    isMember: comment.is_member,
    text: Autolinker.link(parseLocalTextRuns(comment.content.runs, 16)),
    time: toLocalePublicationString({ publishText: comment.published.text.replace('(edited)', '').trim() }),
    likes: comment.vote_count,
    isHearted: comment.is_hearted,
    numReplies: comment.reply_count,
    hasOwnerReplied,
    replyToken,
    showReplies: false,
    replies: []
  }
}

/**
 * video.js only supports MP4 DASH not WebM DASH
 * so we filter out the WebM DASH formats
 * @param {Format[]} formats
 * @param {boolean} allowAv1 Use the AV1 formats if they are available
 */
export function filterFormats(formats, allowAv1 = false) {
  const audioFormats = []
  const h264Formats = []
  const av1Formats = []

  formats.forEach(format => {
    const mimeType = format.mime_type

    if (mimeType.startsWith('audio/mp4')) {
      audioFormats.push(format)
    } else if (allowAv1 && mimeType.startsWith('video/mp4; codecs="av01')) {
      av1Formats.push(format)
    } else if (mimeType.startsWith('video/mp4; codecs="avc')) {
      h264Formats.push(format)
    }
  })

  if (allowAv1 && av1Formats.length > 0) {
    return [...audioFormats, ...av1Formats]
  } else {
    return [...audioFormats, ...h264Formats]
  }
}
