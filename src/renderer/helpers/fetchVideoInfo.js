import store from '../store/index'
import { getLocalVideoInfo } from './api/local'
import { invidiousGetVideoInformation } from './api/invidious'

/**
 * this file is the fetch helper for imported videos from csv
 * fetch video info using the user's preferred backend
 * @param {string} videoId - yt video id
 * @returns {Promise<object>} - video info object
 */
export async function fetchVideoInfo(videoId) {
  const backendPreference = store.getters.getBackendPreference
  try {
    if (backendPreference === 'local') {
      return await getLocalVideoInfo(videoId)
    } else {
      return await invidiousGetVideoInformation(videoId)
    }
  } catch (err) {
    console.error(`fetchVideoInfo: Error fetching info for ${videoId}: ${err.message}`)
    throw err
  }
}
