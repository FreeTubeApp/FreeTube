import { BotGuardClient } from 'bgutils-js/botguard'
import { buildURL, GOOG_API_KEY } from 'bgutils-js/utils'
import { WebPoMinter } from 'bgutils-js/webpo'

// This script has it's own webpack config, as it gets passed as a string to Electron's evaluateJavaScript function
// in src/main/poTokenGenerator.js

/**
 * Based on: https://github.com/LuanRT/BgUtils/blob/main/examples/node/innertube-challenge-fetcher-example.ts
 * @param {string} videoId
 * @param {import('youtubei.js').Session['context']} context
 * @param {object} initialAttestationData
 * @param {object} ytConfig
 */
export default async function (videoId, context, initialAttestationData, ytConfig) {
  const requestKey = 'O43z0dpjhgX20SCx4KAo'

  let challengeData = initialAttestationData.R

  if (!challengeData.bgChallenge) {
    throw new Error('Failed to get BotGuard challenge')
  }

  let interpreterUrl = challengeData.bgChallenge.interpreterUrl?.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue

  if (!interpreterUrl) {
    const challengeResponse = await fetch(
      'https://www.youtube.com/youtubei/v1/att/get?prettyPrint=false&alt=json',
      {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
          'X-Goog-Visitor-Id': context.client.visitorData,
          'X-Youtube-Client-Version': context.client.clientVersion,
          'X-Youtube-Client-Name': '1'
        },
        body: JSON.stringify({
          engagementType: 'ENGAGEMENT_TYPE_UNBOUND',
          eacrToken: initialAttestationData.T,
          context
        }),
      }
    )

    if (!challengeResponse.ok) {
      throw new Error(`Request to ${challengeResponse.url} failed with status ${challengeResponse.status}\n${await challengeResponse.text()}`)
    }

    challengeData = await challengeResponse.json()

    if (!challengeData.bgChallenge) {
      throw new Error('Failed to get BotGuard challenge')
    }

    interpreterUrl = challengeData.bgChallenge.interpreterUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue
  }

  if (interpreterUrl.startsWith('//')) {
    interpreterUrl = `https:${interpreterUrl}`
  }

  window.yt = { config_: ytConfig } // BotGuard reads the EVENT_ID field
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = interpreterUrl
    script.async = true
    script.addEventListener('load', resolve)
    script.addEventListener('error', reject)
    document.head.appendChild(script)
  })
  console.warn('BotGuard environment ' + JSON.stringify({
    globalName: challengeData.bgChallenge.globalName,
    eventId: ytConfig.EVENT_ID,
    interpreterUrl
  }))

  const botGuard = await BotGuardClient.create({
    program: challengeData.bgChallenge.program,
    globalName: challengeData.bgChallenge.globalName,
    globalObject: window
  })

  const webPoSignalOutput = []
  const botGuardResponse = await botGuard.snapshot({ webPoSignalOutput }, 10_000)
  console.warn('BotGuard snapshot completed ' + JSON.stringify({
    responseLength: botGuardResponse.length,
    signalCount: webPoSignalOutput.length
  }))

  const integrityTokenUrl = buildURL('GenerateIT', true)
  console.warn('BotGuard GenerateIT request ' + JSON.stringify({
    url: integrityTokenUrl,
    method: 'POST',
    headers: ['content-type', 'x-goog-api-key', 'x-user-agent']
  }))

  const integrityTokenResponse = await fetch(integrityTokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json+protobuf',
      'x-goog-api-key': GOOG_API_KEY,
      'x-user-agent': 'grpc-web-javascript/0.1',
    },
    body: JSON.stringify([requestKey, botGuardResponse])
  })

  const integrityTokenResponseText = await integrityTokenResponse.text()
  let response

  try {
    response = JSON.parse(integrityTokenResponseText)
  } catch (error) {
    console.error('BotGuard GenerateIT returned invalid JSON', {
      status: integrityTokenResponse.status,
      contentType: integrityTokenResponse.headers.get('content-type'),
      bodyLength: integrityTokenResponseText.length
    })
    throw error
  }

  console.warn('BotGuard GenerateIT response ' + JSON.stringify({
    status: integrityTokenResponse.status,
    ok: integrityTokenResponse.ok,
    contentType: integrityTokenResponse.headers.get('content-type'),
    responseType: Array.isArray(response) ? 'array' : typeof response,
    responseLength: Array.isArray(response) ? response.length : undefined,
    firstValueType: Array.isArray(response) ? typeof response[0] : undefined,
    valueTypes: Array.isArray(response) ? response.slice(0, 4).map(value => value === null ? 'null' : typeof value) : undefined,
    error: Array.isArray(response) ? undefined : response?.error?.status
  }))

  const integrityTokenResponseData = Array.isArray(response)
    ? {
        integrityToken: typeof response[0] === 'string' ? response[0] : undefined,
        estimatedTtlSecs: response[1],
        mintRefreshThreshold: response[2],
        websafeFallbackToken: response[3]
      }
    : response

  if (!integrityTokenResponseData?.integrityToken) {
    if (integrityTokenResponseData?.websafeFallbackToken) {
      return integrityTokenResponseData.websafeFallbackToken
    }
    throw new Error('Could not get integrity token')
  }

  const integrityTokenBasedMinter = await WebPoMinter.create(integrityTokenResponseData, webPoSignalOutput)

  return await integrityTokenBasedMinter.mintAsWebsafeString(videoId)
}
