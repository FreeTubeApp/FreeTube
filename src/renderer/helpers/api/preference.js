import store from '../../store/index'
import i18n from '../../i18n/index'
import { invidiousGetVideoInformation } from './invidious'
import { getLocalVideoInfo, parseLocalTextRuns } from './local'
import { copyToClipboard, showToast } from '../../helpers/utils'

async function runOnPreferredApi(localFunc, invidiousFunc) {
  return new Promise((resolve, reject) => {
    const backendPreference = store.getters.getBackendPreference
    const backendFallback = store.getters.getBackendFallback

    const useInvidious = !process.env.SUPPORTS_LOCAL_API || backendPreference === 'invidious'
    const mainFunction = useInvidious ? invidiousFunc : localFunc
    const fallbackFunction = useInvidious ? localFunc : invidiousFunc

    mainFunction()
      .then(result => {
        const api = useInvidious ? 'invidious' : 'local'
        resolve({ data: result, api: api })
      })
      .catch(async err => {
        console.error('Unable to get data with preferred API')
        console.error(err)
        const errorMessage = useInvidious
          ? i18n.t('Invidious API Error (Click to copy)')
          : i18n.t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })

        if (backendFallback && ((!useInvidious) || (useInvidious && process.env.SUPPORTS_LOCAL_API))) {
          try {
            const fallbackResult = await fallbackFunction()
            const fallbackApi = useInvidious ? 'local' : 'invidious'
            resolve({ data: fallbackResult, api: fallbackApi })
          } catch (err) {
            reject(err)
          }
        } else {
          reject(err)
        }
      })
  })
}

export async function getVideoInfo(videoId) {
  return new Promise((resolve, reject) => {
    const currentLocale = i18n.locale.replace('_', '-')

    const getInvidious = ((videoId) => {
      return invidiousGetVideoInformation(videoId)
    }).bind(null, videoId)
    const getLocal = ((videoId) => {
      return getLocalVideoInfo(videoId)
    }).bind(null, videoId)

    // getVideoInfo supported data
    let videoData = {
      videoId: '',
      title: '',
      author: '',
      authorId: '',
      published: 0,
      description: '',
      viewCount: '',
      isFamilyFriendly: false,
      liveNow: false,
      isUpcoming: false,
      isLiveContent: false,
      isPostLiveDvr: false,
      lengthSeconds: 0,
      thumbnail: '',
      likeCount: 0,
      dislikeCount: 0,
      type: 'video',
    }
    runOnPreferredApi(getLocal, getInvidious)
      .then((obj) => {
        const { data, api } = obj

        if (api === 'local') {
          videoData.videoId = videoId
          videoData.title = data.primary_info?.title.text ?? data.basic_info.title
          videoData.author = data.basic_info.author
          videoData.authorId = data.basic_info.channel_id
          videoData.published = data.videoPublished = new Date(data.page[0].microformat?.publish_date).getTime()
          videoData.description = ''
          if (data.secondary_info?.description.runs) {
            try {
              videoData.description = parseLocalTextRuns(data.secondary_info.description.runs)
            } catch (error) {
              console.error('Failed to extract the localised description, falling back to the standard one.', error, JSON.stringify(data.secondary_info.description.runs))
              videoData.description = data.basic_info.short_description
            }
          } else {
            videoData.description = data.basic_info.short_description
          }
          videoData.viewCount = data.basic_info.view_count
          videoData.isFamilyFriendly = data.basic_info.is_family_safe
          videoData.liveNow = !!data.basic_info.is_live
          videoData.isUpcoming = !!data.basic_info.is_upcoming
          videoData.isLiveContent = !!data.basic_info.is_live_content
          videoData.isPostLiveDvr = !!data.basic_info.is_post_live_dvr
          videoData.isCommentsEnabled = data.comments_entry_point_header != null
          videoData.lengthSeconds = 0
          if (videoData.isUpcoming) {
            let upcomingTimestamp = data.basic_info.start_timestamp
            if (upcomingTimestamp) {
              const timestampOptions = {
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              }
              const now = new Date()
              if (now.getFullYear() < upcomingTimestamp.getFullYear()) {
                Object.defineProperty(timestampOptions, 'year', {
                  value: 'numeric'
                })
              }
              upcomingTimestamp = Intl.DateTimeFormat(currentLocale, timestampOptions).format(upcomingTimestamp)
              let upcomingTimeLeft = upcomingTimestamp - now
              upcomingTimeLeft = (upcomingTimeLeft / 1000)
              upcomingTimeLeft = Math.floor(upcomingTimeLeft)
              videoData.lengthSeconds = upcomingTimeLeft
            }
          } else {
            videoData.lengthSeconds = data.basic_info.duration
          }
          videoData.thumbnail = data.basic_info?.thumbnail?.length > 0 ? data.basic_info.thumbnail[0].url : undefined
          videoData.likeCount = isNaN(data.basic_info.like_count) ? 0 : data.basic_info.like_count
          // YouTube doesn't return dislikes anymore
          videoData.dislikeCount = 0
        } else if (api === 'invidious') {
          videoData = data
          videoData.isLiveContent = videoData.liveNow || videoData.isUpcoming || videoData.isPostLiveDvr
          videoData.thumbnail = data.videoThumbnails[0].url
        }

        if (api === 'invidious' && videoData.title.length === 0) {
          reject(i18n.t('Settings.Data Settings.Unable to load video'))
        }

        resolve(videoData)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
