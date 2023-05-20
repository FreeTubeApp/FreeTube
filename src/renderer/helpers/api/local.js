import { ClientType, Endpoints, Innertube, Misc, Utils, YT } from 'youtubei.js'
import Autolinker from 'autolinker'
import { join } from 'path'

import { PlayerCache } from './PlayerCache'
import {
  CHANNEL_HANDLE_REGEX,
  extractNumberFromString,
  getUserDataPath,
  toLocalePublicationString
} from '../utils'

const TRACKING_PARAM_NAMES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]

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
 * @param {string} location
 * @param {'default'|'music'|'gaming'|'movies'} tab
 * @param {import('youtubei.js').Mixins.TabbedFeed|null} instance
 */
export async function getLocalTrending(location, tab, instance) {
  if (instance === null) {
    const innertube = await createInnertube({ location })
    instance = await innertube.getTrending()
  }

  // youtubei.js's tab names are localised, so we need to use the index to get tab name that youtubei.js expects
  const tabIndex = ['default', 'music', 'gaming', 'movies'].indexOf(tab)
  const resultsInstance = await instance.getTabByName(instance.tabs[tabIndex])

  let results

  // the default tab can have duplicate videos so we need to deduplicate them
  if (tab === 'default') {
    const alreadySeenIds = []
    results = []

    resultsInstance.videos.forEach(video => {
      if (video.type === 'Video' && !alreadySeenIds.includes(video.id)) {
        alreadySeenIds.push(video.id)
        results.push(parseLocalListVideo(video))
      }
    })
  } else {
    results = resultsInstance.videos
      .filter((video) => video.type === 'Video')
      .map(parseLocalListVideo)
  }

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
 * @param {YT.Search} continuationData
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
 * @param {Misc.Format[]} formats
 * @param {import('youtubei.js').Player} player
 */
function decipherFormats(formats, player) {
  for (const format of formats) {
    format.url = format.decipher(player)

    // set these to undefined so that toDash doesn't try to decipher them again, throwing an error
    format.cipher = undefined
    format.signature_cipher = undefined
  }
}

export async function getLocalChannelId(url) {
  try {
    const innertube = await createInnertube()

    // resolveURL throws an error if the URL doesn't exist
    const navigationEndpoint = await innertube.resolveURL(url)

    if (navigationEndpoint.metadata.page_type === 'WEB_PAGE_TYPE_CHANNEL') {
      return navigationEndpoint.payload.browseId
    } else {
      return null
    }
  } catch {
    return null
  }
}

/**
 * Returns the channel or the channel termination reason
 * @param {string} id
 */
export async function getLocalChannel(id) {
  const innertube = await createInnertube()
  let result
  try {
    result = await innertube.getChannel(id)
  } catch (error) {
    if (error instanceof Utils.ChannelError) {
      result = {
        alert: error.message
      }
    } else {
      throw error
    }
  }
  return result
}

export async function getLocalChannelVideos(id) {
  const innertube = await createInnertube()

  try {
    const response = await innertube.actions.execute(Endpoints.BrowseEndpoint.PATH, Endpoints.BrowseEndpoint.build({
      browse_id: id,
      params: 'EgZ2aWRlb3PyBgQKAjoA'
      // protobuf for the videos tab (this is the one that YouTube uses,
      // it has some empty fields in the protobuf but it doesn't work if you remove them)
    }))

    const videosTab = new YT.Channel(null, response)

    // if the channel doesn't have a videos tab, YouTube returns the home tab instead
    // so we need to check that we got the right tab
    if (videosTab.current_tab?.endpoint.metadata.url?.endsWith('/videos')) {
      return parseLocalChannelVideos(videosTab.videos, videosTab.header.author)
    } else {
      return []
    }
  } catch (error) {
    console.error(error)
    if (error instanceof Utils.ChannelError) {
      return null
    } else {
      throw error
    }
  }
}

/**
 * @param {import('youtubei.js').YTNodes.Video[]} videos
 * @param {Misc.Author} author
 */
export function parseLocalChannelVideos(videos, author) {
  const parsedVideos = videos.map(parseLocalListVideo)

  // fix empty author info
  parsedVideos.forEach(video => {
    video.author = author.name
    video.authorId = author.id
  })

  return parsedVideos
}

/**
 * @param {import('youtubei.js').YTNodes.ReelItem[]} shorts
 * @param {Misc.Author} author
 */
export function parseLocalChannelShorts(shorts, author) {
  return shorts.map(short => {
    // unfortunately the only place with the duration is the accesibility string
    const duration = parseShortDuration(short.accessibility_label, short.id)

    return {
      type: 'video',
      videoId: short.id,
      title: short.title.text,
      author: author.name,
      authorId: author.id,
      viewCount: parseLocalSubscriberCount(short.views.text),
      lengthSeconds: isNaN(duration) ? '' : duration
    }
  })
}

/**
 * Shorts can only be up to 60 seconds long, so we only need to handle seconds and minutes
 * Of course this is YouTube, so are edge cases that don't match the docs, like example 3 taken from LTT
 *
 * https://support.google.com/youtube/answer/10059070?hl=en
 *
 * Example input strings:
 * - These mice keep getting WEIRDER... - 59 seconds - play video
 * - How Low Can Our Resolution Go? - 1 minute - play video
 * - I just found out about Elon. #SHORTS - 1 minute, 1 second - play video
 * @param {string} accessibilityLabel
 * @param {string} videoId only used for error logging
 */
function parseShortDuration(accessibilityLabel, videoId) {
  // we want to count from the end of the array,
  // as it's possible that the title could contain a `-` too
  const timeString = accessibilityLabel.split('-').at(-2)

  if (typeof timeString === 'undefined') {
    console.error(`Failed to parse local API short duration from accessibility label. video ID: ${videoId}, text: "${accessibilityLabel}"`)
    return NaN
  }

  let duration = 0

  const matches = timeString.matchAll(/(\d+) (second|minute)s?/g)

  // matchAll returns an iterator, which doesn't have a length property
  // so we need to check if it's empty this way instead
  let validDuration = false

  for (const match of matches) {
    let number = parseInt(match[1])

    if (isNaN(number) || match[2].length === 0) {
      validDuration = false
      break
    }

    validDuration = true

    if (match[2] === 'minute') {
      number *= 60
    }

    duration += number
  }

  if (!validDuration) {
    console.error(`Failed to parse local API short duration from accessibility label. video ID: ${videoId}, text: "${accessibilityLabel}"`)
    return NaN
  }

  return duration
}

/**
 * @typedef {import('youtubei.js').YTNodes.Playlist} Playlist
 * @typedef {import('youtubei.js').YTNodes.GridPlaylist} GridPlaylist
 */

/**
 * @param {Playlist|GridPlaylist} playlist
 * @param {Misc.Author} author
 */
export function parseLocalListPlaylist(playlist, author = undefined) {
  let channelName
  let channelId = null

  if (playlist.author) {
    if (playlist.author instanceof Misc.Text) {
      channelName = playlist.author.text

      if (author) {
        channelId = author.id
      }
    } else {
      channelName = playlist.author.name
      channelId = playlist.author.id
    }
  } else {
    channelName = author.name
    channelId = author.id
  }

  return {
    type: 'playlist',
    dataSource: 'local',
    title: playlist.title.text,
    thumbnail: playlist.thumbnails[0].url,
    channelName,
    channelId,
    playlistId: playlist.id,
    videoCount: extractNumberFromString(playlist.video_count.text)
  }
}

/**
 * @param {YT.Search} response
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
 * @param {import('youtubei.js').YTNodes.PlaylistVideo} video
 */
export function parseLocalPlaylistVideo(video) {
  return {
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds,
    liveNow: video.is_live,
    isUpcoming: video.is_upcoming,
    premiereDate: video.upcoming
  }
}

/**
 * @param {import('youtubei.js').YTNodes.Video} video
 */
export function parseLocalListVideo(video) {
  return {
    type: 'video',
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    description: video.description,
    viewCount: extractNumberFromString(video.view_count.text),
    publishedText: video.published.isEmpty() ? null : video.published.text,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds,
    liveNow: video.is_live,
    isUpcoming: video.is_upcoming || video.is_premiere,
    premiereDate: video.upcoming
  }
}

/**
 * @param {import('youtubei.js').Helpers.YTNode} item
 */
function parseListItem(item) {
  switch (item.type) {
    case 'Video':
      return parseLocalListVideo(item)
    case 'Channel': {
      /** @type {import('youtubei.js').YTNodes.Channel} */
      const channel = item

      // see upstream TODO: https://github.com/LuanRT/YouTube.js/blob/main/src/parser/classes/Channel.ts#L33

      // according to https://github.com/iv-org/invidious/issues/3514#issuecomment-1368080392
      // the response can be the new or old one, so we currently need to handle both here
      let subscribers = null
      let videos = null
      let handle = null
      if (channel.subscriber_count.text?.startsWith('@')) {
        handle = channel.subscriber_count.text

        if (!channel.video_count.isEmpty()) {
          subscribers = channel.video_count.text
        }
      } else {
        videos = extractNumberFromString(channel.video_count.text)

        if (!channel.subscriber_count.isEmpty()) {
          subscribers = channel.subscriber_count.text
        }
      }

      return {
        type: 'channel',
        dataSource: 'local',
        thumbnail: channel.author.best_thumbnail?.url,
        name: channel.author.name,
        id: channel.author.id,
        subscribers,
        videos,
        handle,
        descriptionShort: channel.description_snippet.text
      }
    }
    case 'Playlist': {
      return parseLocalListPlaylist(item)
    }
  }
}

/**
 * @param {import('youtubei.js').YTNodes.CompactVideo} video
 */
export function parseLocalWatchNextVideo(video) {
  return {
    type: 'video',
    videoId: video.id,
    title: video.title.text,
    author: video.author.name,
    authorId: video.author.id,
    viewCount: extractNumberFromString(video.view_count.text),
    publishedText: video.published.isEmpty() ? null : video.published.text,
    lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds,
    liveNow: video.is_live,
    isUpcoming: video.is_premiere
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
      convertedFilters.duration = filters.duration
    }
  }

  return convertedFilters
}

/**
 * @param {(Misc.TextRun|Misc.EmojiRun)[]} runs
 * @param {number} emojiSize
 * @param {{looseChannelNameDetection: boolean}} options
 */
export function parseLocalTextRuns(runs, emojiSize = 16, options = { looseChannelNameDetection: false }) {
  if (!Array.isArray(runs)) {
    throw new Error('not an array of text runs')
  }

  const timestampRegex = /^(?:\d+:){1,2}\d+$/
  const spacesBeforeRegex = /^\s+/
  const spacesAfterRegex = /\s+$/
  const parsedRuns = []

  for (const run of runs) {
    if (run instanceof Misc.EmojiRun) {
      const { emoji, text } = run

      // empty array if video creator removes a channel emoji so we ignore.
      // eg: pinned comment here https://youtu.be/v3wm83zoSSY
      if (emoji.image.length > 0) {
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
      }
    } else {
      const { text, bold, italics, strikethrough, endpoint } = run

      if (endpoint) {
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
            // In comments, mention can be `@Channel Name` (not handle, but name)
            if (CHANNEL_HANDLE_REGEX.test(trimmedText) || (options.looseChannelNameDetection && trimmedText.startsWith('@'))) {
              // Note that in regex `\s` must be used since the text contain non-default space (the half-width space char when we press spacebar)
              const spacesBefore = (spacesBeforeRegex.exec(text) || [''])[0]
              const spacesAfter = (spacesAfterRegex.exec(text) || [''])[0]
              parsedRuns.push(`${spacesBefore}<a href="https://www.youtube.com/channel/${endpoint.payload.browseId}">${trimmedText}</a>${spacesAfter}`)
            } else {
              parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            }
            break
          }
          case 'WEB_PAGE_TYPE_PLAYLIST':
          case 'WEB_PAGE_TYPE_SHORTS':
            parsedRuns.push(`https://www.youtube.com${endpoint.metadata.url}`)
            break
          case 'WEB_PAGE_TYPE_BROWSE':
            parsedRuns.push(`<a href="https://www.youtube.com${endpoint.metadata.url}">${text}</a>`)
            break
          case 'WEB_PAGE_TYPE_UNKNOWN':
          default: {
            const url = new URL((endpoint.dialog?.type === 'ConfirmDialog' && endpoint.dialog.confirm_button.endpoint.payload.url) || endpoint.payload.url)
            if (url.hostname === 'www.youtube.com' && url.pathname === '/redirect' && url.searchParams.has('q')) {
              // remove utm tracking parameters
              const realURLStr = url.searchParams.get('q')
              const realURL = new URL(realURLStr)
              let urlChanged = false

              TRACKING_PARAM_NAMES.forEach((paramName) => {
                if (!realURL.searchParams.has(paramName)) { return }

                realURL.searchParams.delete(paramName)
                urlChanged = true
              })

              // `searchParams.delete` changes query string unnecessarily
              // Using original unless there is any change
              parsedRuns.push(urlChanged ? realURL.toString() : realURLStr)
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
 * @param {Misc.Format} format
 */
export function mapLocalFormat(format) {
  return {
    itag: format.itag,
    qualityLabel: format.quality_label,
    fps: format.fps,
    bitrate: format.bitrate,
    mimeType: format.mime_type,
    height: format.height,
    width: format.width,
    url: format.url
  }
}

/**
 * @param {import('youtubei.js').YTNodes.Comment} comment
 * @param {import('youtubei.js').YTNodes.CommentThread} commentThread
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
    memberIconUrl: comment.is_member ? comment.sponsor_comment_badge.custom_badge[0].url : '',
    text: Autolinker.link(parseLocalTextRuns(comment.content.runs, 16, { looseChannelNameDetection: true })),
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
 * @param {Misc.Format[]} formats
 * @param {boolean} allowAv1 Use the AV1 formats if they are available
 */
export function filterLocalFormats(formats, allowAv1 = false) {
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

/**
 * Really not a fan of this :(, YouTube returns the subscribers as "15.1M subscribers"
 * so we have to parse it somehow
 * @param {string} text
 */
export function parseLocalSubscriberCount(text) {
  const match = text
    .replace(',', '.')
    .toUpperCase()
    .match(/([\d.]+)\s*([KM]?)/)

  let subscribers
  if (match) {
    subscribers = parseFloat(match[1])

    if (match[2] === 'K') {
      subscribers *= 1000
    } else if (match[2] === 'M') {
      subscribers *= 1000_000
    }

    subscribers = Math.trunc(subscribers)
  } else {
    subscribers = extractNumberFromString(text)
  }

  return subscribers
}

/**
 * Parse community posts
 * @param {import('youtubei.js').YTNodes.BackstagePost} post
 */
export function parseLocalCommunityPost(post) {
  let replyCount = post.action_buttons?.reply_button?.text ?? null
  if (replyCount !== null) {
    replyCount = parseLocalSubscriberCount(post?.action_buttons.reply_button.text)
  }

  return {
    postText: post.content.isEmpty() ? '' : Autolinker.link(parseLocalTextRuns(post.content.runs, 16)),
    postId: post.id,
    authorThumbnails: post.author.thumbnails,
    publishedText: post.published.text,
    voteCount: post.vote_count,
    postContent: parseLocalAttachment(post.attachment),
    commentCount: replyCount,
    author: post.author.name,
    type: 'community'
  }
}

function parseLocalAttachment(attachment) {
  if (!attachment) {
    return null
  }
  // image post
  if (attachment.type === 'BackstageImage') {
    return {
      type: 'image',
      content: attachment.image
    }
  } else if (attachment.type === 'Video') {
    return {
      type: 'video',
      content: parseLocalListVideo(attachment)
    }
  } else if (attachment.type === 'Playlist') {
    return {
      type: 'playlist',
      content: parseLocalListPlaylist(attachment)
    }
  } else if (attachment.type === 'PostMultiImage') {
    return {
      type: 'multiImage',
      content: attachment.images.map(thumbnail => thumbnail.image)
    }
  } else if (attachment.type === 'Poll') {
    return {
      type: 'poll',
      totalVotes: attachment.total_votes ?? 0,
      content: attachment.choices.map(choice => {
        return {
          text: choice.text.text,
          image: choice.image
        }
      })
    }
  } else {
    console.error(attachment)
    console.error('unknown type')
  }
}

export async function getHashtagLocal(hashtag) {
  const innertube = await createInnertube()
  return await innertube.getHashtag(hashtag)
}
