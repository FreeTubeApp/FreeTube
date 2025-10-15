import { session, WebContentsView } from 'electron'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Generates a content-bound poToken (proof of origin token) using `bgutils-js`.
 * The script to generate it is `src/botGuardScript.js`
 *
 * This is intentionally split out into it's own thing, with it's own temporary in-memory session,
 * as the BotGuard stuff accesses the global `document` and `window` objects and also requires making some requests.
 * So we definitely don't want it running in the same places as the rest of the FreeTube code with the user data.
 * @param {string} videoId
 * @param {string} context
 * @param {string|undefined} proxyUrl
 * @returns {Promise<string>}
 */
export async function generatePoToken(videoId, context, proxyUrl) {
  const sessionUuid = crypto.randomUUID()

  const theSession = session.fromPartition(`potoken-${sessionUuid}`, { cache: false })

  theSession.setPermissionCheckHandler(() => false)
  // eslint-disable-next-line n/no-callback-literal
  theSession.setPermissionRequestHandler((webContents, permission, callback) => callback(false))

  theSession.setUserAgent(session.defaultSession.getUserAgent())

  if (proxyUrl) {
    await theSession.setProxy({
      proxyRules: proxyUrl
    })
  }

  theSession.webRequest.onBeforeSendHeaders({
    urls: ['https://www.google.com/js/*', 'https://www.youtube.com/youtubei/*']
  }, ({ requestHeaders, url }, callback) => {
    if (url.startsWith('https://www.youtube.com/youtubei/')) {
      // make InnerTube requests work with the fetch function
      // InnerTube rejects requests if the referer isn't YouTube or empty
      requestHeaders.Referer = 'https://www.youtube.com/'
      requestHeaders.Origin = 'https://www.youtube.com'

      requestHeaders['Sec-Fetch-Site'] = 'same-origin'
      requestHeaders['Sec-Fetch-Mode'] = 'same-origin'
      requestHeaders['X-Youtube-Bootstrap-Logged-In'] = 'false'
    } else {
      requestHeaders['Sec-Fetch-Dest'] = 'script'
      requestHeaders['Sec-Fetch-Site'] = 'cross-site'
      requestHeaders['Accept-Language'] = '*'
    }

    callback({ requestHeaders })
  })

  const webContentsView = new WebContentsView({
    webPreferences: {
      backgroundThrottling: false,
      safeDialogs: true,
      sandbox: true,
      v8CacheOptions: 'none',
      session: theSession,
      offscreen: true,
      webSecurity: false,
      disableBlinkFeatures: 'ElectronCSSCornerSmoothing'
    }
  })

  webContentsView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  webContentsView.webContents.setAudioMuted(true)
  webContentsView.setBounds({
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  })

  webContentsView.webContents.debugger.attach()

  await webContentsView.webContents.loadURL('data:text/html,<!DOCTYPE html><html lang="en"><head><title></title></head><body></body></html>', {
    baseURLForDataURL: 'https://www.youtube.com/'
  })

  await webContentsView.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1920,
    screenHeight: 1080,
    positionX: 0,
    positionY: 0,
    screenOrientation: {
      type: 'landscapePrimary',
      angle: 0
    }
  })

  const script = await getScript(videoId, context)

  const response = await webContentsView.webContents.executeJavaScript(script)

  webContentsView.webContents.close({ waitForBeforeUnload: false })
  await theSession.closeAllConnections()

  return response
}

let cachedScript

/**
 * @param {string} videoId
 * @param {string} context
 */
async function getScript(videoId, context) {
  if (!cachedScript) {
    const pathToScript = process.env.NODE_ENV === 'development'
      ? join(__dirname, '../../dist/botGuardScript.js')
      : join(__dirname, 'botGuardScript.js')

    const content = await readFile(pathToScript, 'utf-8')

    const match = content.match(/export{(\w+) as default};/)

    const functionName = match[1]

    cachedScript = content.replace(match[0], `;${functionName}(FT_PARAMS)`)
  }

  return cachedScript.replace('FT_PARAMS', `"${videoId}",${context}`)
}
