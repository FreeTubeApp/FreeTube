import { invidiousGetChannelInfo } from './api/invidious'
import { getLocalChannel, parseLocalChannelHeader } from './api/local'

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
    if (!process.env.SUPPORTS_LOCAL_API || backendOptions.preference === 'invidious') {
      return await invidiousGetChannelInfo(id)
    } else {
      return await getLocalChannel(id)
    }
  } catch (err) {
    // don't bother with fallback if channel doesn't exist
    if (err.message && err.message === 'This channel does not exist.') {
      return { invalid: true }
    }
    if (process.env.SUPPORTS_LOCAL_API && backendOptions.fallback) {
      if (backendOptions.preference === 'invidious') {
        return await getLocalChannel(id)
      }
      if (backendOptions.preference === 'local') {
        return await invidiousGetChannelInfo(id)
      }
    } else {
      throw err
    }
  }
}

/**
 * @param {string} id
 * @param {{
 *   preference: string,
 *   fallback: boolean,
 * }} backendOptions
 * @returns {Promise<{icon: string, iconHref: string, preferredName: string} | { invalidId: boolean }>}
 */
export async function findChannelTagInfo(id, backendOptions) {
  if (!checkYoutubeChannelId(id)) return { invalidId: true }
  try {
    const channel = await findChannelById(id, backendOptions)
    if (!process.env.SUPPORTS_LOCAL_API || backendOptions.preference === 'invidious') {
      if (channel.invalid) return { invalidId: true }
      return {
        preferredName: channel.author,
        icon: channel.authorThumbnails[0].url
      }
    } else {
      if (channel.alert) return { invalidId: true }

      const { name, thumbnailUrl } = parseLocalChannelHeader(channel)

      return {
        preferredName: name,
        icon: thumbnailUrl,
        iconHref: `/channel/${id}`
      }
    }
  } catch (err) {
    console.error(err)
    return { preferredName: '', icon: '', iconHref: '', err }
  }
}

/**
 * Check whether Id provided might be a YouTube Id
 * @param {string} id
 * @returns {boolean}
 */
export function checkYoutubeChannelId(id) {
  return /^UC[\w-]{22}$/.test(id)
}
