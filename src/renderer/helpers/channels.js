import { invidiousGetChannelInfo } from './api/invidious'
import { getLocalChannel } from './api/local'

/**
 * @param {string} id
 * @param {{
*   preference: string,
*   fallback: boolean,
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
* @returns {Promise<{icon: string, preferredName: string}>}
*/
export async function findChannelTagInfo(id, backendOptions) {
  if (!/UC\S{22}/.test(id)) return ''
  try {
    const channel = await findChannelById(id, backendOptions)
    if (backendOptions.preference === 'invidious') {
      return {
        preferredName: channel.author,
        icon: channel.authorThumbnails[0].url
      }
    } else {
      return {
        preferredName: channel.header.author.name,
        icon: channel.header.author.thumbnails.pop().url
      }
    }
  } catch (err) {
    console.error(err)
    return { preferredName: '', icon: '' }
  }
}
