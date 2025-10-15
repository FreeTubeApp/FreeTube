import { BG, buildURL, GOOG_API_KEY } from 'bgutils-js'

// This script has it's own webpack config, as it gets passed as a string to Electron's evaluateJavaScript function
// in src/main/poTokenGenerator.js

/**
 * Based on: https://github.com/LuanRT/BgUtils/blob/main/examples/node/innertube-challenge-fetcher-example.ts
 * @param {string} videoId
 * @param {import('youtubei.js').Session['context']} context
 */
export default async function (videoId, context) {
  const requestKey = 'O43z0dpjhgX20SCx4KAo'

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
        context
      }),
    }
  )

  if (!challengeResponse.ok) {
    throw new Error(`Request to ${challengeResponse.url} failed with status ${challengeResponse.status}\n${await challengeResponse.text()}`)
  }

  const challengeData = await challengeResponse.json()

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

  const botGuard = await BG.BotGuardClient.create({
    program: challengeData.bgChallenge.program,
    globalName: challengeData.bgChallenge.globalName,
    globalObj: window
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

  const integrityTokenBasedMinter = await BG.WebPoMinter.create({ integrityToken: response[0] }, webPoSignalOutput)

  return await integrityTokenBasedMinter.mintAsWebsafeString(videoId)
}
