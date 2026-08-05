import { BotGuardClient } from 'bgutils-js/botguard'
import { buildURL, GOOG_API_KEY, parseLooseJSON } from 'bgutils-js/utils'
import { WebPoMinter } from 'bgutils-js/webpo'

// This script has it's own webpack config, as it gets passed as a string to Electron's evaluateJavaScript function
// in src/main/poTokenGenerator.js

/**
 * Based on: https://github.com/LuanRT/BgUtils/blob/main/examples/node/innertube-challenge-fetcher-example.ts
 * @param {string} videoId
 * @param {string} visitorId
 */
export default async function (videoId, visitorId) {
  const requestKey = 'O43z0dpjhgX20SCx4KAo'

  const htmlResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}&bpctr=9999999999&has_verified=1`, {
    headers: {
      'X-Cookie': `VISITOR_INFO1_LIVE=${visitorId}`
    }
  })
  const htmlPage = await htmlResponse.text()

  const ytConfig = htmlPage.match(/ytcfg\.set\(({.+?})\);/s)?.[1]
  if (!ytConfig) {
    throw new Error('Could not find ytcfg in the HTML page')
  }

  window.yt = { config_: JSON.parse(ytConfig) } // BotGuard reads the EVENT_ID field

  const initialAttestationData = htmlPage.match(/window\.ytAtN\(\s*({[\s\S]*?})\s*\)/)

  if (!initialAttestationData) {
    throw new Error('Could not find challenge in the HTML page')
  }

  const initialAttestationDataJson = parseLooseJSON(initialAttestationData[1])
  const challengeData = initialAttestationDataJson.R

  if (!challengeData.bgChallenge) {
    throw new Error('Failed to get BotGuard challenge')
  }

  let interpreterUrl = challengeData.bgChallenge.interpreterUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue

  if (interpreterUrl.startsWith('//')) {
    interpreterUrl = `https:${interpreterUrl}`
  }

  const bgScriptResponse = await fetch(interpreterUrl)
  const interpreterJavascript = await bgScriptResponse.text()

  if (interpreterJavascript) {
    // eslint-disable-next-line no-new-func
    new Function(interpreterJavascript)()
  } else {
    throw new Error('Could not load VM.')
  }

  const botGuard = await BotGuardClient.create({
    program: challengeData.bgChallenge.program,
    globalName: challengeData.bgChallenge.globalName,
    globalObject: window
  })

  const webPoSignalOutput = []
  const botGuardResponse = await botGuard.snapshot({ webPoSignalOutput }, 10_000)

  const integrityTokenResponse = await fetch(buildURL('GenerateIT', true), {
    method: 'POST',
    headers: {
      'content-type': 'application/json+protobuf',
      'x-goog-api-key': GOOG_API_KEY,
      'x-user-agent': 'grpc-web-javascript/0.1',
    },
    body: JSON.stringify([requestKey, botGuardResponse])
  })

  const response = await integrityTokenResponse.json()

  if (typeof response[0] !== 'string') {
    throw new Error('Could not get integrity token')
  }

  const integrityTokenBasedMinter = await WebPoMinter.create({ integrityToken: response[0] }, webPoSignalOutput)

  return await integrityTokenBasedMinter.mintAsWebsafeString(videoId)
}
