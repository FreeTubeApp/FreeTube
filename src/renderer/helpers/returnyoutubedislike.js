import store from '../store/index'

export async function getVideoDislikes(videoId) {
  let requestUrl

  const url = store.getters.getReturnYouTubeDislikesUrl
  if (new URL(url).hostname.replace('www.', '') === 'returnyoutubedislikeapi.com') {
    requestUrl = `https://returnyoutubedislikeapi.com/Votes?videoId=${videoId}`
  } else {
    requestUrl = `${url}/votes/${videoId}`
  }

  const response = await fetch(requestUrl).then(res => res.json())

  return response.dislikes
}

export function getRYDInstances() {
  // hopefully we get an official instance list at some point instead of hard coding...
  return [
    'https://returnyoutubedislikeapi.com',
    'https://ryd-proxy.kavin.rocks',
    'https://ryd-proxy.privacydev.net'
  ]
}
