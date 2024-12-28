import { BG } from 'bgutils-js'

// This script has it's own webpack config, as it gets passed as a string to Electron's evaluateJavaScript function
// in src/main/poTokenGenerator.js
export default async function(visitorData) {
  const requestKey = 'O43z0dpjhgX20SCx4KAo'

  const bgConfig = {
    fetch: (input, init) => fetch(input, init),
    requestKey,
    globalObj: window,
    identifier: visitorData
  }

  const challenge = await BG.Challenge.create(bgConfig)

  if (!challenge) {
    throw new Error('Could not get challenge')
  }

  const interpreterJavascript = challenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue

  if (interpreterJavascript) {
    // eslint-disable-next-line no-new-func
    new Function(interpreterJavascript)()
  } else {
    console.warn('Unable to load VM.')
  }

  const poTokenResult = await BG.PoToken.generate({
    program: challenge.program,
    globalName: challenge.globalName,
    bgConfig
  })

  return poTokenResult.poToken
}
