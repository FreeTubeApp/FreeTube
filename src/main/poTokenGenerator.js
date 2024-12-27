import { session, WebContentsView } from 'electron'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Generates a poToken (proof of origin token) using `bgutils-js`.
 * The script to generate it is `src/botGuardScript.js`
 *
 * This is intentionally split out into it's own thing, with it's own temporary in-memory session,
 * as the BotGuard stuff accesses the global `document` and `window` objects and also requires making some requests.
 * So we definitely don't want it running in the same places as the rest of the FreeTube code with the user data.
 * @param {string} visitorData
 * @returns {Promise<string>}
 */
export async function generatePoToken(visitorData) {
  const sessionUuid = crypto.randomUUID()

  const theSession = session.fromPartition(`potoken-${sessionUuid}`, { cache: false })

  theSession.setPermissionCheckHandler(() => false)
  // eslint-disable-next-line n/no-callback-literal
  theSession.setPermissionRequestHandler((webContents, permission, callback) => callback(false))

  theSession.setUserAgent(
    theSession.getUserAgent()
      .split(' ')
      .filter(part => !part.includes('Electron'))
      .join(' ')
  )

  const webContentsView = new WebContentsView({
    webPreferences: {
      backgroundThrottling: false,
      safeDialogs: true,
      sandbox: true,
      v8CacheOptions: 'none',
      session: theSession,
      offscreen: true
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

  await webContentsView.webContents.loadURL('data:text/html,', {
    baseURLForDataURL: 'https://www.youtube.com'
  })

  await webContentsView.webContents.debugger.sendCommand('Emulation.setUserAgentOverride', {
    userAgent: theSession.getUserAgent(),
    acceptLanguage: 'en-US',
    platform: 'Win32',
    userAgentMetadata: {
      brands: [
        {
          brand: 'Not/A)Brand',
          version: '99'
        },
        {
          brand: 'Chromium',
          version: process.versions.chrome.split('.')[0]
        }
      ],
      fullVersionList: [
        {
          brand: 'Not/A)Brand',
          version: '99.0.0.0'
        },
        {
          brand: 'Chromium',
          version: process.versions.chrome
        }
      ],
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
      wow64: false
    }
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

  const script = await getScript(visitorData)

  const response = await webContentsView.webContents.executeJavaScript(script)

  webContentsView.webContents.close({ waitForBeforeUnload: false })
  await theSession.closeAllConnections()

  return response
}

let cachedScript

/**
 * @param {string} visitorData
 */
async function getScript(visitorData) {
  if (!cachedScript) {
    const pathToScript = process.env.NODE_ENV === 'development'
      ? join(__dirname, '../../dist/botGuardScript.js')
      /* eslint-disable-next-line n/no-path-concat */
      : `${__dirname}/botGuardScript.js`

    const content = await readFile(pathToScript, 'utf-8')

    const match = content.match(/export{(\w+) as default};/)

    const functionName = match[1]

    cachedScript = content.replace(match[0], `;${functionName}("FT_VISITOR_DATA")`)
  }

  return cachedScript.replace('FT_VISITOR_DATA', visitorData)
}
