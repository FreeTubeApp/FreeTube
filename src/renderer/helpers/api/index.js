import * as invidious from './invidious'
import * as local from './local'

export const channelShorts = async (api, channelId, idType, sortBy) => {
  const shortsFunc = api === 'invidious' ? invidious.channelShortsInvidious : local.channelShortsLocal
  const result = await shortsFunc(channelId, idType, sortBy)
  return api === 'invidious' ? invidious.parseShortsResponse(result) : local.parseShortsResponse(result)
}
