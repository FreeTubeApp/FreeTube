import { SocksProxyAgent } from 'socks-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import { state } from './store/modules/utils'

export const $$ = document.querySelectorAll.bind(document)
export const $ = document.querySelector.bind(document)

export function returnProxyAgent(settings) {
  if (!settings.useProxy) {
    return null
  }

  const proxyProtocol = settings.proxyProtocol
  const proxyHostname = settings.proxyHostname
  const proxyPort = settings.proxyPort

  switch (proxyProtocol) {
    case 'http':
      return new HttpProxyAgent({
        host: proxyHostname,
        port: proxyPort
      })
    case 'https':
      return new HttpsProxyAgent({
        host: proxyHostname,
        port: proxyPort
      })
    case 'socks4':
      return new SocksProxyAgent({
        host: proxyHostname,
        port: proxyPort,
        type: 4
      })
    case 'socks5':
      return new SocksProxyAgent({
        host: proxyHostname,
        port: proxyPort,
        type: 5
      })
    default:
      return null
  }
}

export function calculatePublishedDate(publishedText) {
  if (publishedText === 'Live') {
    return publishedText
  }

  const date = new Date()
  const textSplit = publishedText.split(' ')

  if (textSplit[0].toLowerCase() === 'streamed') {
    textSplit.shift()
  }

  const timeFrame = textSplit[1]
  const timeAmount = parseInt(textSplit[0])
  let timeSpan = null

  if (timeFrame.indexOf('second') > -1) {
    timeSpan = timeAmount * 1000
  } else if (timeFrame.indexOf('minute') > -1) {
    timeSpan = timeAmount * 60000
  } else if (timeFrame.indexOf('hour') > -1) {
    timeSpan = timeAmount * 3600000
  } else if (timeFrame.indexOf('day') > -1) {
    timeSpan = timeAmount * 86400000
  } else if (timeFrame.indexOf('week') > -1) {
    timeSpan = timeAmount * 604800000
  } else if (timeFrame.indexOf('month') > -1) {
    timeSpan = timeAmount * 2592000000
  } else if (timeFrame.indexOf('year') > -1) {
    timeSpan = timeAmount * 31556952000
  }

  return date.getTime() - timeSpan
}

export function calculateColorLuminance(colorValue) {
  const cutHex = colorValue.substring(1, 7)
  const colorValueR = parseInt(cutHex.substring(0, 2), 16)
  const colorValueG = parseInt(cutHex.substring(2, 4), 16)
  const colorValueB = parseInt(cutHex.substring(4, 6), 16)

  const luminance = (0.299 * colorValueR + 0.587 * colorValueG + 0.114 * colorValueB) / 255

  if (luminance > 0.5) {
    return '#000000'
  }
  return '#FFFFFF'
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

export function getRandomColor() {
  const randomInt = getRandomInt(state.colorValues.length)
  return state.colorValues[randomInt]
}

export function getRandomColorClass() {
  const randomInt = getRandomInt(state.colorClasses.length)
  return state.colorClasses[randomInt]
}
