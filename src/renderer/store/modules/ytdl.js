import ytdl from 'ytdl-core'

import { SocksProxyAgent } from 'socks-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'

const state = {}

const getters = {}

function createProxyAgent(protocol, hostname, port) {
  switch (protocol) {
    case 'http':
      return new HttpProxyAgent({
        host: hostname,
        port: port
      })
    case 'https':
      return new HttpsProxyAgent({
        host: hostname,
        port: port
      })
    case 'socks4':
      return new SocksProxyAgent({
        hostname: hostname,
        port: port,
        type: 4
      })
    case 'socks5':
      return new SocksProxyAgent({
        hostname: hostname,
        port: port,
        type: 5
      })
  }
}

const actions = {
  ytGetVideoInformation ({ rootState }, videoId) {
    return new Promise((resolve, reject) => {
      let agent = null
      const settings = rootState.settings

      if (settings.useProxy) {
        agent = createProxyAgent(settings.proxyProtocol, settings.proxyHostname, settings.proxyPort)
      }

      ytdl.getInfo(videoId, {
        lang: 'en-US',
        requestOptions: { agent }
      }).then((result) => {
        resolve(result)
      }).catch((err) => {
        reject(err)
      })
    })
  }
}

const mutations = {}

export default {
  state,
  getters,
  actions,
  mutations
}
