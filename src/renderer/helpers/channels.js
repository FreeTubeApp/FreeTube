import { invidiousGetChannelInfo } from './api/invidious'
import { getLocalChannel } from './api/local'

/**
 * @param {string} id
 * @param {{
*   preference: string,
*   fallback: boolean,
*   invalid: boolean,
* }} backendOptions
*/
async function findChannelById(id, backendOptions) {
  try {
    if (backendOptions.preference === 'invidious') {
      return await invidiousGetChannelInfo(id)
    } else {
      return await getLocalChannel(id)
    }
  } catch (err) {
    // don't bother with fallback if channel doesn't exist
    if (err.message && err.message === 'This channel does not exist.') {
      return { invalid: true }
    }
    if (backendOptions.fallback && backendOptions.preference === 'invidious') {
      return await getLocalChannel(id)
    }
    if (backendOptions.fallback && backendOptions.preference === 'local') {
      return await invidiousGetChannelInfo(id)
    }
  }
}

/**
 * @param {string} id
 * @param {{
*   preference: string,
*   fallback: boolean,
* }} backendOptions
* @returns {Promise<{icon: string, preferredName: string, invalidId: boolean}>}
*/
export async function findChannelTagInfo(id, backendOptions) {
  if (!/UC\S{22}/.test(id)) return ''
  try {
    const channel = await findChannelById(id, backendOptions)
    if (backendOptions.preference === 'invidious') {
      if (channel.invalid) return { invalidId: true }
      return {
        preferredName: channel.author,
        icon: channel.authorThumbnails[0].url
      }
    } else {
      if (channel.alert) return { invalidId: true }
      return {
        preferredName: channel.header.author.name,
        icon: channel.header.author.thumbnails.pop().url
      }
    }
  } catch (err) {
    console.error(err)
    return { preferredName: '', icon: '', err }
  }
}

/**
 * Check whether Id provided might be a YouTube Id
 * @param {string} id
 * @returns {boolean}
 */
export function checkYoutubeId(id) {
  return /UC\S{22}/.test(id)
}
