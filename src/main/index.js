import {
  app, BrowserWindow, dialog, Menu, ipcMain,
  powerSaveBlocker, screen, session, shell,
  nativeTheme, net, protocol, clipboard
} from 'electron'
import path from 'path'
import cp from 'child_process'

import {
  IpcChannels,
  DBActions,
  SyncEvents,
  ABOUT_BITCOIN_ADDRESS,
} from '../constants'
import * as baseHandlers from '../datastores/handlers/base'
import { extractExpiryTimestamp, ImageCache } from './ImageCache'
import { existsSync } from 'fs'
import asyncFs from 'fs/promises'
import { promisify } from 'util'
import { brotliDecompress } from 'zlib'

import contextMenu from 'electron-context-menu'

import packageDetails from '../../package.json'

const brotliDecompressAsync = promisify(brotliDecompress)

if (process.argv.includes('--version')) {
  app.exit()
} else {
  runApp()
}

function runApp() {
  /** @type {Set<string>} */
  let ALLOWED_RENDERER_FILES

  if (process.env.NODE_ENV === 'production') {
    // __FREETUBE_ALLOWED_PATHS__ is replaced by the injectAllowedPaths.mjs script
    // eslint-disable-next-line no-undef
    ALLOWED_RENDERER_FILES = new Set(__FREETUBE_ALLOWED_PATHS__)

    protocol.registerSchemesAsPrivileged([{
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true
      }
    }])
  }

  contextMenu({
    showSearchWithGoogle: false,
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showSelectAll: false,
    showCopyLink: false,
    prepend: (defaultActions, parameters, browserWindow) => [
      {
        label: 'Show / Hide Video Statistics',
        visible: parameters.mediaType === 'video',
        click: () => {
          browserWindow.webContents.send(IpcChannels.SHOW_VIDEO_STATISTICS)
        }
      },
      {
        label: 'Open in a New Window',
        // Only show the option for in-app URLs and not external ones
        visible: parameters.linkURL.split('#')[0] === browserWindow.webContents.getURL().split('#')[0],
        click: () => {
          createWindow({ replaceMainWindow: false, windowStartupUrl: parameters.linkURL, showWindowNow: true })
        }
      },
      // Only show select all in text fields
      {
        label: 'Select All',
        enabled: parameters.editFlags.canSelectAll,
        visible: parameters.isEditable,
        click: () => {
          browserWindow.webContents.selectAll()
        }
      }
    ],
    // only show the copy link entry for external links and the /playlist, /channel and /watch in-app URLs
    // the /playlist, /channel and /watch in-app URLs get transformed to their equivalent YouTube or Invidious URLs
    append: (defaultActions, parameters, browserWindow) => {
      let visible = false
      const urlParts = parameters.linkURL.split('#')
      const isInAppUrl = urlParts[0] === browserWindow.webContents.getURL().split('#')[0]

      if (parameters.linkURL.length > 0) {
        if (isInAppUrl) {
          const path = urlParts[1]

          if (path) {
            visible = ['/channel', '/watch', '/hashtag'].some(p => path.startsWith(p)) ||
              // Only show copy link entry for non user playlists
              (path.startsWith('/playlist') && !/playlistType=user/.test(path))
          }
        } else {
          visible = true
        }
      }

      const copy = (url) => {
        if (parameters.linkText) {
          clipboard.write({
            bookmark: parameters.linkText,
            text: url
          })
        } else {
          clipboard.writeText(url)
        }
      }

      const transformURL = (toYouTube) => {
        let origin

        if (toYouTube) {
          origin = 'https://www.youtube.com'
        } else {
          origin = 'https://redirect.invidious.io'
        }

        const [path, query] = urlParts[1].split('?')
        const [route, id] = path.split('/').filter(p => p)

        switch (route) {
          case 'playlist':
            return `${origin}/playlist?list=${id}`
          case 'channel':
            return `${origin}/channel/${id}`
          case 'hashtag':
            return `${origin}/hashtag/${id}`
          case 'watch': {
            let url

            if (toYouTube) {
              url = new URL(`https://youtu.be/${id}`)
            } else {
              url = new URL(`https://redirect.invidious.io/watch?v=${id}`)
            }

            if (query) {
              const params = new URLSearchParams(query)
              const newParams = new URLSearchParams(url.search)
              let hasParams = false

              if (params.has('playlistId') && params.get('playlistType') !== 'user') {
                newParams.set('list', params.get('playlistId'))
                hasParams = true
              }

              if (params.has('timestamp')) {
                newParams.set('t', params.get('timestamp'))
                hasParams = true
              }

              if (hasParams) {
                url.search = newParams.toString()
              }
            }

            return url.toString()
          }
        }
      }

      return [
        {
          label: 'Copy Lin&k',
          visible: visible && !isInAppUrl,
          click: () => {
            copy(parameters.linkURL)
          }
        },
        {
          label: 'Copy YouTube Link',
          visible: visible && isInAppUrl,
          click: () => {
            copy(transformURL(true))
          }
        },
        {
          label: 'Copy Invidious Link',
          visible: visible && isInAppUrl,
          click: () => {
            copy(transformURL(false))
          }
        }
      ]
    }
  })

  // disable electron warning
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  const isDebug = process.argv.includes('--debug')

  let mainWindow
  let startupUrl

  if (process.platform === 'linux') {
    // Enable hardware acceleration via VA-API with OpenGL if no other feature flags are found
    // https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/gpu/vaapi.md
    if (!app.commandLine.hasSwitch('enable-features')) {
      app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecodeLinuxGL')
    }
  }

  const userDataPath = app.getPath('userData')

  // command line switches need to be added before the app ready event first
  // that means we can't use the normal settings system as that is asynchronous,
  // doing it synchronously ensures that we add it before the event fires
  const REPLACE_HTTP_CACHE_PATH = `${userDataPath}/experiment-replace-http-cache`
  const replaceHttpCache = existsSync(REPLACE_HTTP_CACHE_PATH)
  if (replaceHttpCache) {
    // the http cache causes excessive disk usage during video playback
    // we've got a custom image cache to make up for disabling the http cache
    // experimental as it increases RAM use in favour of reduced disk use
    app.commandLine.appendSwitch('disable-http-cache')
  }

  const PLAYER_CACHE_PATH = `${userDataPath}/player_cache`

  // See: https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
  // remove so we can register each time as we run the app.
  app.removeAsDefaultProtocolClient('freetube')

  // If we are running a non-packaged version of the app && on windows
  if (process.env.NODE_ENV === 'development' && process.platform === 'win32') {
    // Set the path of electron.exe and your app.
    // These two additional parameters are only available on windows.
    app.setAsDefaultProtocolClient('freetube', process.execPath, [path.resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient('freetube')
  }

  if (process.env.NODE_ENV !== 'development') {
    // Only allow single instance of the application
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    }

    app.on('second-instance', (_, commandLine, __) => {
      // Someone tried to run a second instance, we should focus our window
      if (mainWindow && typeof commandLine !== 'undefined') {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()

        const url = getLinkUrl(commandLine)
        if (url) {
          mainWindow.webContents.send(IpcChannels.OPEN_URL, url)
        }
      }
    })
  }

  app.on('ready', async (_, __) => {
    if (process.env.NODE_ENV === 'production') {
      protocol.handle('app', async (request) => {
        if (request.method !== 'GET') {
          return new Response(null, {
            status: 405,
            headers: {
              Allow: 'GET'
            }
          })
        }

        const { host, pathname } = new URL(request.url)

        if (host !== 'bundle' || !ALLOWED_RENDERER_FILES.has(pathname)) {
          return new Response(null, {
            status: 400
          })
        }

        const contents = await asyncFs.readFile(path.join(__dirname, pathname))

        if (pathname.endsWith('.json.br')) {
          const decompressed = await brotliDecompressAsync(contents)

          return new Response(decompressed.buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Encoding': 'br'
            }
          })
        } else {
          return new Response(contents.buffer, {
            status: 200,
            headers: {
              'Content-Type': contentTypeFromFileExtension(pathname.split('.').at(-1))
            }
          })
        }
      })
    }

    // Electron defaults to approving all permission checks and permission requests.
    // FreeTube only needs a few permissions, so we reject requests for other permissions
    // and reject all requests on non-FreeTube URLs.
    //
    // FreeTube needs the following permissions:
    // - "fullscreen": So that the video player can enter full screen
    // - "clipboard-sanitized-write": To allow the user to copy video URLs and error messages

    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
      if (!isFreeTubeUrl(requestingOrigin)) {
        return false
      }

      return permission === 'fullscreen' || permission === 'clipboard-sanitized-write'
    })

    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      if (!isFreeTubeUrl(webContents.getURL())) {
        // eslint-disable-next-line n/no-callback-literal
        callback(false)
        return
      }

      callback(permission === 'fullscreen' || permission === 'clipboard-sanitized-write')
    })

    let docArray
    try {
      docArray = await baseHandlers.settings._findAppReadyRelatedSettings()
    } catch (err) {
      console.error(err)
      app.exit()
      return
    }

    let disableSmoothScrolling = false
    let useProxy = false
    let proxyProtocol = 'socks5'
    let proxyHostname = '127.0.0.1'
    let proxyPort = '9050'

    if (docArray?.length > 0) {
      docArray.forEach((doc) => {
        switch (doc._id) {
          case 'disableSmoothScrolling':
            disableSmoothScrolling = doc.value
            break
          case 'useProxy':
            useProxy = doc.value
            break
          case 'proxyProtocol':
            proxyProtocol = doc.value
            break
          case 'proxyHostname':
            proxyHostname = doc.value
            break
          case 'proxyPort':
            proxyPort = doc.value
            break
        }
      })
    }

    if (disableSmoothScrolling) {
      app.commandLine.appendSwitch('disable-smooth-scrolling')
    } else {
      app.commandLine.appendSwitch('enable-smooth-scrolling')
    }

    if (useProxy) {
      session.defaultSession.setProxy({
        proxyRules: `${proxyProtocol}://${proxyHostname}:${proxyPort}`
      })
    }

    const fixedUserAgent = session.defaultSession.getUserAgent()
      .split(' ')
      .filter(part => !part.includes('Electron') && !part.includes(packageDetails.productName))
      .join(' ')
    session.defaultSession.setUserAgent(fixedUserAgent)

    // Set CONSENT cookie on reasonable domains
    const consentCookieDomains = [
      'https://www.youtube.com',
      'https://youtube.com'
    ]
    consentCookieDomains.forEach(url => {
      session.defaultSession.cookies.set({
        url: url,
        name: 'CONSENT',
        value: 'YES+',
        sameSite: 'no_restriction'
      })
    })

    session.defaultSession.cookies.set({
      url: 'https://www.youtube.com',
      name: 'SOCS',
      value: 'CAI',
      sameSite: 'no_restriction',
    })

    const onBeforeSendHeadersRequestFilter = {
      urls: ['https://*/*', 'http://*/*'],
      types: ['xhr', 'media', 'image']
    }
    session.defaultSession.webRequest.onBeforeSendHeaders(onBeforeSendHeadersRequestFilter, ({ requestHeaders, url, resourceType, webContents }, callback) => {
      const urlObj = new URL(url)

      if (url.startsWith('https://www.youtube.com/youtubei/')) {
        // make InnerTube requests work with the fetch function
        // InnerTube rejects requests if the referer isn't YouTube or empty
        requestHeaders.Referer = 'https://www.youtube.com/'
        requestHeaders.Origin = 'https://www.youtube.com'

        // Make iOS requests work and look more realistic
        if (requestHeaders['x-youtube-client-name'] === '5') {
          delete requestHeaders.Referer
          delete requestHeaders.Origin
          delete requestHeaders['Sec-Fetch-Site']
          delete requestHeaders['Sec-Fetch-Mode']
          delete requestHeaders['Sec-Fetch-Dest']
          delete requestHeaders['sec-ch-ua']
          delete requestHeaders['sec-ch-ua-mobile']
          delete requestHeaders['sec-ch-ua-platform']

          requestHeaders['User-Agent'] = requestHeaders['x-user-agent']
          delete requestHeaders['x-user-agent']
        } else {
          requestHeaders['Sec-Fetch-Site'] = 'same-origin'
          requestHeaders['Sec-Fetch-Mode'] = 'same-origin'
          requestHeaders['X-Youtube-Bootstrap-Logged-In'] = 'false'
        }
      } else if (urlObj.origin.endsWith('.googlevideo.com') && urlObj.pathname === '/videoplayback') {
        requestHeaders.Referer = 'https://www.youtube.com/'
        requestHeaders.Origin = 'https://www.youtube.com'

        // YouTube doesn't send the Content-Type header for the media requests, so we shouldn't either
        delete requestHeaders['Content-Type']

        // YouTube throttles the adaptive formats if you request a chunk larger than 10MiB.
        // For the DASH formats we are fine as video.js doesn't seem to ever request chunks that big.
        // The legacy formats don't have any chunk size limits.
        // For the audio formats we need to handle it ourselves, as the browser requests the entire audio file,
        // which means that for most videos that are longer than 10 mins, we get throttled, as the audio track file sizes surpass that 10MiB limit.

        // This code checks if the file is larger than the limit, by checking the `clen` query param,
        // which YouTube helpfully populates with the content length for us.
        // If it does surpass that limit, it then checks if the requested range is larger than the limit
        // (seeking right at the end of the video, would result in a small enough range to be under the chunk limit)
        // if that surpasses the limit too, it then limits the requested range to 10MiB, by setting the range to `start-${start + 10MiB}`.
        if (resourceType === 'media' && urlObj.searchParams.get('mime')?.startsWith('audio/') && requestHeaders.Range) {
          const TEN_MIB = 10 * 1024 * 1024

          const contentLength = parseInt(new URL(url).searchParams.get('clen'))

          if (contentLength > TEN_MIB) {
            const [startStr, endStr] = requestHeaders.Range.split('=')[1].split('-')

            const start = parseInt(startStr)

            // handle open ended ranges like `0-` and `1234-`
            const end = endStr.length === 0 ? contentLength : parseInt(endStr)

            if (end - start > TEN_MIB) {
              const newEnd = start + TEN_MIB

              requestHeaders.Range = `bytes=${start}-${newEnd}`
            }
          }
        }
      } else if (webContents) {
        const invidiousAuthorization = invidiousAuthorizations.get(webContents.id)

        if (invidiousAuthorization && url.startsWith(invidiousAuthorization.url)) {
          requestHeaders.Authorization = invidiousAuthorization.authorization
        }
      }

      // eslint-disable-next-line n/no-callback-literal
      callback({ requestHeaders })
    })

    // when we create a real session on the watch page, youtube returns tracking cookies, which we definitely don't want
    const trackingCookieRequestFilter = { urls: ['https://www.youtube.com/sw.js_data', 'https://www.youtube.com/iframe_api'] }

    session.defaultSession.webRequest.onHeadersReceived(trackingCookieRequestFilter, ({ responseHeaders }, callback) => {
      if (responseHeaders) {
        delete responseHeaders['set-cookie']
      }
      // eslint-disable-next-line n/no-callback-literal
      callback({ responseHeaders })
    })

    if (replaceHttpCache) {
      // in-memory image cache

      const imageCache = new ImageCache()

      protocol.handle('imagecache', (request) => {
        const [requestUrl, rawWebContentsId] = request.url.split('#')

        return new Promise((resolve, reject) => {
          const url = decodeURIComponent(requestUrl.substring(13))
          if (imageCache.has(url)) {
            const cached = imageCache.get(url)

            resolve(new Response(cached.data, {
              headers: { 'content-type': cached.mimeType }
            }))
            return
          }

          let headers

          if (rawWebContentsId) {
            const invidiousAuthorization = invidiousAuthorizations.get(parseInt(rawWebContentsId))

            if (invidiousAuthorization && url.startsWith(invidiousAuthorization.url)) {
              headers = {
                Authorization: invidiousAuthorization.authorization
              }
            }
          }

          const newRequest = net.request({
            method: request.method,
            url,
            headers
          })

          // Electron doesn't allow certain headers to be set:
          // https://www.electronjs.org/docs/latest/api/client-request#requestsetheadername-value
          // also blacklist Origin and Referrer as we don't want to let YouTube know about them
          const blacklistedHeaders = ['content-length', 'host', 'trailer', 'te', 'upgrade', 'cookie2', 'keep-alive', 'transfer-encoding', 'origin', 'referrer']

          for (const header of Object.keys(request.headers)) {
            if (!blacklistedHeaders.includes(header.toLowerCase())) {
              newRequest.setHeader(header, request.headers[header])
            }
          }

          newRequest.on('response', (response) => {
            const chunks = []
            response.on('data', (chunk) => {
              chunks.push(chunk)
            })

            response.on('end', () => {
              const data = Buffer.concat(chunks)

              const expiryTimestamp = extractExpiryTimestamp(response.headers)
              const mimeType = response.headers['content-type']

              imageCache.add(url, mimeType, data, expiryTimestamp)

              resolve(new Response(data, {
                headers: { 'content-type': mimeType }
              }))
            })

            response.on('error', (error) => {
              console.error('image cache error', error)
              reject(error)
            })
          })

          newRequest.on('error', (err) => {
            console.error(err)
          })

          newRequest.end()
        })
      })

      const imageRequestFilter = { urls: ['https://*/*', 'http://*/*'], types: ['image'] }
      session.defaultSession.webRequest.onBeforeRequest(imageRequestFilter, (details, callback) => {
        // the requests made by the imagecache:// handler to fetch the image,
        // are allowed through, as their resourceType is 'other'

        let redirectURL = `imagecache://${encodeURIComponent(details.url)}`

        if (details.webContents) {
          redirectURL += `#${details.webContents.id}`
        }

        callback({
          redirectURL
        })
      })

      // --- end of `if experimentsDisableDiskCache` ---
    }

    await createWindow()

    if (process.env.NODE_ENV === 'development') {
      try {
        require('vue-devtools').install()
      } catch (err) {
        console.error(err)
      }
    }

    if (isDebug) {
      mainWindow.webContents.openDevTools()
    }
  })

  /**
   * @param {string} extension
   */
  function contentTypeFromFileExtension(extension) {
    switch (extension) {
      case 'html':
        return 'text/html'
      case 'css':
        return 'text/css'
      case 'js':
        return 'text/javascript'
      case 'ttf':
        return 'font/ttf'
      case 'woff':
        return 'font/woff'
      case 'svg':
        return 'image/svg+xml'
      case 'png':
        return 'image/png'
      case 'json':
        return 'application/json'
      case 'txt':
        return 'text/plain'
      default:
        return 'application/octet-stream'
    }
  }

  /**
   * @param {string} urlString
   */
  function isFreeTubeUrl(urlString) {
    const { protocol, host, pathname } = new URL(urlString)

    if (process.env.NODE_ENV === 'development') {
      return protocol === 'http:' && host === 'localhost:9080' && (pathname === '/' || pathname === '/index.html')
    } else {
      return protocol === 'app:' && host === 'bundle' && pathname === '/index.html'
    }
  }

  async function createWindow(
    {
      replaceMainWindow = true,
      windowStartupUrl = null,
      showWindowNow = false,
      searchQueryText = null
    } = { }) {
    // Syncing new window background to theme choice.
    const windowBackground = await baseHandlers.settings._findTheme().then((setting) => {
      if (!setting) {
        return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
      }

      switch (setting.value) {
        case 'dark':
          return '#212121'
        case 'light':
          return '#f1f1f1'
        case 'black':
          return '#000000'
        case 'dracula':
          return '#282a36'
        case 'catppuccin-mocha':
          return '#1e1e2e'
        case 'pastel-pink':
          return '#ffd1dc'
        case 'hot-pink':
          return '#de1c85'
        case 'nordic':
          return '#2b2f3a'
        case 'solarized-dark':
          return '#002B36'
        case 'solarized-light':
          return '#fdf6e3'
        case 'system':
        default:
          return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
      }
    }).catch((error) => {
      console.error(error)
      // Default to nativeTheme settings if nothing is found.
      return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
    })

    /**
     * Initial window options
     */
    const commonBrowserWindowOptions = {
      backgroundColor: windowBackground,
      darkTheme: nativeTheme.shouldUseDarkColors,
      icon: process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../_icons/iconColor.png')
        /* eslint-disable-next-line n/no-path-concat */
        : `${__dirname}/_icons/iconColor.png`,
      autoHideMenuBar: true,
      // useContentSize: true,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: false,
        webSecurity: false,
        backgroundThrottling: false,
        contextIsolation: false
      }
    }

    const newWindow = new BrowserWindow(
      Object.assign(
        {
          // It will be shown later when ready via `ready-to-show` event
          show: showWindowNow
        },
        commonBrowserWindowOptions
      )
    )

    // region Ensure child windows use same options since electron 14

    // https://github.com/electron/electron/blob/14-x-y/docs/api/window-open.md#native-window-example
    newWindow.webContents.setWindowOpenHandler((details) => {
      createWindow({
        replaceMainWindow: false,
        showWindowNow: true,
        windowStartupUrl: details.url
      })
      return {
        action: 'deny'
      }
    })

    // endregion Ensure child windows use same options since electron 14

    if (replaceMainWindow) {
      mainWindow = newWindow
    }

    newWindow.setBounds({
      width: 1200,
      height: 800
    })

    const boundsDoc = await baseHandlers.settings._findBounds()
    if (typeof boundsDoc?.value === 'object') {
      const { maximized, fullScreen, ...bounds } = boundsDoc.value
      const windowVisible = screen.getAllDisplays().some(display => {
        const { x, y, width, height } = display.bounds
        return !(bounds.x > x + width || bounds.x + bounds.width < x || bounds.y > y + height || bounds.y + bounds.height < y)
      })

      if (windowVisible) {
        newWindow.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        })
      }

      if (maximized) {
        newWindow.maximize()
      }

      if (fullScreen) {
        newWindow.setFullScreen(true)
      }
    }

    // If called multiple times
    // Duplicate menu items will be added
    if (replaceMainWindow) {
      // eslint-disable-next-line
      setMenu()
    }

    // load root file/url
    if (process.env.NODE_ENV === 'development') {
      let devStartupURL = 'http://localhost:9080'
      if (windowStartupUrl != null) {
        devStartupURL = windowStartupUrl
      }
      newWindow.loadURL(devStartupURL)
    } else {
      if (windowStartupUrl != null) {
        newWindow.loadURL(windowStartupUrl)
      } else {
        newWindow.loadURL('app://bundle/index.html')
      }
    }

    if (typeof searchQueryText === 'string' && searchQueryText.length > 0) {
      ipcMain.once(IpcChannels.SEARCH_INPUT_HANDLING_READY, () => {
        newWindow.webContents.send(IpcChannels.UPDATE_SEARCH_INPUT_TEXT, searchQueryText)
      })
    }

    // Show when loaded
    newWindow.once('ready-to-show', () => {
      if (newWindow.isVisible()) {
        // only open the dev tools if they aren't already open
        if (process.env.NODE_ENV === 'development' && !newWindow.webContents.isDevToolsOpened()) {
          newWindow.webContents.openDevTools({ activate: false })
        }
        return
      }

      newWindow.show()
      newWindow.focus()

      if (process.env.NODE_ENV === 'development') {
        newWindow.webContents.openDevTools({ activate: false })
      }
    })

    newWindow.once('close', async () => {
      if (BrowserWindow.getAllWindows().length !== 1) {
        return
      }

      const value = {
        ...newWindow.getNormalBounds(),
        maximized: newWindow.isMaximized(),
        fullScreen: newWindow.isFullScreen()
      }

      await baseHandlers.settings._updateBounds(value)
    })

    newWindow.once('closed', () => {
      const allWindows = BrowserWindow.getAllWindows()
      if (allWindows.length !== 0 && newWindow === mainWindow) {
        // Replace mainWindow to avoid accessing `mainWindow.webContents`
        // Which raises "Object has been destroyed" error
        mainWindow = allWindows[0]
      }
    })
  }

  ipcMain.once(IpcChannels.APP_READY, () => {
    if (startupUrl) {
      mainWindow.webContents.send(IpcChannels.OPEN_URL, startupUrl)
    }
  })

  function relaunch() {
    if (process.env.NODE_ENV === 'development') {
      app.exit(parseInt(process.env.FREETUBE_RELAUNCH_EXIT_CODE))
      return
    }

    // The AppImage and Windows portable formats must be accounted for
    // because `process.execPath` points at the temporarily extracted
    // executables, not the executables themselves
    //
    // It's possible to detect these formats and identify their
    // executables' paths by checking the environmental variables
    const { env: { APPIMAGE, PORTABLE_EXECUTABLE_FILE } } = process

    if (!APPIMAGE) {
      // If it's a Windows portable, PORTABLE_EXECUTABLE_FILE will
      // hold a value.
      // Otherwise, `process.execPath` should be used instead.
      app.relaunch({
        args: process.argv.slice(1),
        execPath: PORTABLE_EXECUTABLE_FILE || process.execPath
      })
    } else {
      // If it's an AppImage, things must be done the "hard way"
      // `app.relaunch` doesn't work because of FUSE limitations
      // Spawn a new process using the APPIMAGE env variable
      const subprocess = cp.spawn(APPIMAGE, { detached: true, stdio: 'ignore' })
      subprocess.unref()
    }

    app.quit()
  }

  ipcMain.once(IpcChannels.RELAUNCH_REQUEST, () => {
    relaunch()
  })

  nativeTheme.on('updated', () => {
    const allWindows = BrowserWindow.getAllWindows()

    allWindows.forEach((window) => {
      window.webContents.send(IpcChannels.NATIVE_THEME_UPDATE, nativeTheme.shouldUseDarkColors)
    })
  })

  ipcMain.on(IpcChannels.ENABLE_PROXY, (_, url) => {
    session.defaultSession.setProxy({
      proxyRules: url
    })
    session.defaultSession.closeAllConnections()
  })

  ipcMain.on(IpcChannels.DISABLE_PROXY, () => {
    session.defaultSession.setProxy({})
    session.defaultSession.closeAllConnections()
  })

  ipcMain.handle(IpcChannels.OPEN_EXTERNAL_LINK, (_, url) => {
    if (typeof url === 'string') {
      let parsedURL

      try {
        parsedURL = new URL(url)
      } catch {
        // If it's not a valid URL don't open it
        return false
      }

      if (
        parsedURL.protocol === 'http:' || parsedURL.protocol === 'https:' ||

        // Email address on the about page and Autolinker detects and links email addresses
        parsedURL.protocol === 'mailto:' ||

        // Autolinker detects and links phone numbers
        parsedURL.protocol === 'tel:' ||

        // Donation links on the about page
        (parsedURL.protocol === 'bitcoin:' && parsedURL.pathname === ABOUT_BITCOIN_ADDRESS)
      ) {
        shell.openExternal(url)
        return true
      }
    }

    return false
  })

  ipcMain.handle(IpcChannels.GET_SYSTEM_LOCALE, () => {
    // we should switch to getPreferredSystemLanguages at some point and iterate through until we find a supported locale
    return app.getSystemLocale()
  })

  ipcMain.handle(IpcChannels.GET_PICTURES_PATH, () => {
    return app.getPath('pictures')
  })

  ipcMain.handle(IpcChannels.SHOW_OPEN_DIALOG, async ({ sender }, options) => {
    const senderWindow = findSenderWindow(sender)
    if (senderWindow) {
      return await dialog.showOpenDialog(senderWindow, options)
    }
    return await dialog.showOpenDialog(options)
  })

  ipcMain.handle(IpcChannels.SHOW_SAVE_DIALOG, async ({ sender }, options) => {
    const senderWindow = findSenderWindow(sender)
    if (senderWindow) {
      return await dialog.showSaveDialog(senderWindow, options)
    }
    return await dialog.showSaveDialog(options)
  })

  function findSenderWindow(sender) {
    return BrowserWindow.getAllWindows().find((window) => {
      return window.webContents.id === sender.id
    })
  }

  ipcMain.on(IpcChannels.STOP_POWER_SAVE_BLOCKER, (_, id) => {
    powerSaveBlocker.stop(id)
  })

  ipcMain.handle(IpcChannels.START_POWER_SAVE_BLOCKER, (_) => {
    return powerSaveBlocker.start('prevent-display-sleep')
  })

  ipcMain.on(IpcChannels.CREATE_NEW_WINDOW, (_e, { windowStartupUrl = null, searchQueryText = null } = { }) => {
    createWindow({
      replaceMainWindow: false,
      showWindowNow: true,
      windowStartupUrl: windowStartupUrl,
      searchQueryText: searchQueryText
    })
  })

  ipcMain.on(IpcChannels.OPEN_IN_EXTERNAL_PLAYER, (_, payload) => {
    const child = cp.spawn(payload.executable, payload.args, { detached: true, stdio: 'ignore' })
    child.unref()
  })

  ipcMain.handle(IpcChannels.GET_REPLACE_HTTP_CACHE, () => {
    return replaceHttpCache
  })

  ipcMain.once(IpcChannels.TOGGLE_REPLACE_HTTP_CACHE, async () => {
    if (replaceHttpCache) {
      await asyncFs.rm(REPLACE_HTTP_CACHE_PATH)
    } else {
      // create an empty file
      const handle = await asyncFs.open(REPLACE_HTTP_CACHE_PATH, 'w')
      await handle.close()
    }

    relaunch()
  })

  function playerCachePathForKey(key) {
    // Remove path separators and period characters,
    // to prevent any files outside of the player_cache directory,
    // from being read or written
    const sanitizedKey = `${key}`.replaceAll(/[./\\]/g, '__')

    return path.join(PLAYER_CACHE_PATH, sanitizedKey)
  }

  ipcMain.handle(IpcChannels.PLAYER_CACHE_GET, async (_, key) => {
    const filePath = playerCachePathForKey(key)

    try {
      const contents = await asyncFs.readFile(filePath)

      return contents.buffer
    } catch (e) {
      console.error(e)
      return undefined
    }
  })

  ipcMain.handle(IpcChannels.PLAYER_CACHE_SET, async (_, key, value) => {
    const filePath = playerCachePathForKey(key)

    await asyncFs.mkdir(PLAYER_CACHE_PATH, { recursive: true })

    await asyncFs.writeFile(filePath, new Uint8Array(value))
  })

  /** @type {Map<number, { url: string, authorization: string }>} */
  const invidiousAuthorizations = new Map()

  ipcMain.on(IpcChannels.SET_INVIDIOUS_AUTHORIZATION, (event, authorization, url) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    if (!authorization) {
      invidiousAuthorizations.delete(event.sender.id)
    } else if (typeof authorization === 'string' && typeof url === 'string') {
      invidiousAuthorizations.set(event.sender.id, { authorization, url })
    }
  })

  // ************************************************* //
  // DB related IPC calls
  // *********** //

  // Settings
  ipcMain.handle(IpcChannels.DB_SETTINGS, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.FIND:
          return await baseHandlers.settings.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.settings.upsert(data._id, data.value)
          syncOtherWindows(
            IpcChannels.SYNC_SETTINGS,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          switch (data._id) {
            // Update app menu on related setting update
            case 'hideTrendingVideos':
            case 'hidePopularVideos':
            case 'backendFallback':
            case 'backendPreference':
            case 'hidePlaylists':
              await setMenu()
              break

            default:
              // Do nothing for unmatched settings
          }
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid settings db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //
  // History
  ipcMain.handle(IpcChannels.DB_HISTORY, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.FIND:
          return await baseHandlers.history.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.history.upsert(data)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        case DBActions.HISTORY.UPDATE_WATCH_PROGRESS:
          await baseHandlers.history.updateWatchProgress(data.videoId, data.watchProgress)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.HISTORY.UPDATE_WATCH_PROGRESS, data }
          )
          return null

        case DBActions.HISTORY.UPDATE_PLAYLIST:
          await baseHandlers.history.updateLastViewedPlaylist(data.videoId, data.lastViewedPlaylistId, data.lastViewedPlaylistType, data.lastViewedPlaylistItemId)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.HISTORY.UPDATE_PLAYLIST, data }
          )
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.history.delete(data)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.GENERAL.DELETE, data }
          )
          return null

        case DBActions.GENERAL.DELETE_ALL:
          await baseHandlers.history.deleteAll()
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.GENERAL.DELETE_ALL }
          )
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid history db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //
  // Profiles
  ipcMain.handle(IpcChannels.DB_PROFILES, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.CREATE: {
          const newProfile = await baseHandlers.profiles.create(data)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.GENERAL.CREATE, data: newProfile }
          )
          return newProfile
        }

        case DBActions.GENERAL.FIND:
          return await baseHandlers.profiles.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.profiles.upsert(data)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        case DBActions.PROFILES.ADD_CHANNEL:
          await baseHandlers.profiles.addChannelToProfiles(data.channel, data.profileIds)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.PROFILES.ADD_CHANNEL, data }
          )
          return null

        case DBActions.PROFILES.REMOVE_CHANNEL:
          await baseHandlers.profiles.removeChannelFromProfiles(data.channelId, data.profileIds)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.PROFILES.REMOVE_CHANNEL, data }
          )
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.profiles.delete(data)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.GENERAL.DELETE, data }
          )
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid profile db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //
  // Playlists
  // ! NOTE: A lot of these actions are currently not used for anything
  // As such, only the currently used actions have synchronization implemented
  // The remaining should have it implemented only when playlists
  // get fully implemented into the app
  ipcMain.handle(IpcChannels.DB_PLAYLISTS, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.CREATE:
          await baseHandlers.playlists.create(data)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.GENERAL.CREATE, data }
          )
          return null

        case DBActions.GENERAL.FIND:
          return await baseHandlers.playlists.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.playlists.upsert(data)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        case DBActions.PLAYLISTS.UPSERT_VIDEO:
          await baseHandlers.playlists.upsertVideoByPlaylistId(data._id, data.videoData)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.UPSERT_VIDEO, data }
          )
          return null

        case DBActions.PLAYLISTS.UPSERT_VIDEOS:
          await baseHandlers.playlists.upsertVideosByPlaylistId(data._id, data.videos)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.UPSERT_VIDEOS, data }
          )
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.playlists.delete(data)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.GENERAL.DELETE, data }
          )
          return null

        case DBActions.PLAYLISTS.DELETE_VIDEO_ID:
          await baseHandlers.playlists.deleteVideoIdByPlaylistId({
            _id: data._id,
            videoId: data.videoId,
            playlistItemId: data.playlistItemId,
          })
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.DELETE_VIDEO, data }
          )
          return null

        case DBActions.PLAYLISTS.DELETE_VIDEO_IDS:
          await baseHandlers.playlists.deleteVideoIdsByPlaylistId(data._id, data.videoIds)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.PLAYLISTS.DELETE_ALL_VIDEOS:
          await baseHandlers.playlists.deleteAllVideosByPlaylistId(data)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.GENERAL.DELETE_MULTIPLE:
          await baseHandlers.playlists.deleteMultiple(data)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.GENERAL.DELETE_ALL:
          await baseHandlers.playlists.deleteAll()
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid playlist db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //

  function syncOtherWindows(channel, event, payload) {
    const otherWindows = BrowserWindow.getAllWindows().filter((window) => {
      return window.webContents.id !== event.sender.id
    })

    for (const window of otherWindows) {
      window.webContents.send(channel, payload)
    }
  }

  // ************************************************* //

  let resourcesCleanUpDone = false

  app.on('window-all-closed', () => {
    // Clean up resources (datastores' compaction + Electron cache and storage data clearing)
    cleanUpResources().finally(() => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  })

  if (process.platform === 'darwin') {
    // `window-all-closed` doesn't fire for Cmd+Q
    // https://www.electronjs.org/docs/latest/api/app#event-window-all-closed
    // This is also fired when `app.quit` called
    // Not using `before-quit` since that one is fired before windows are closed
    app.on('will-quit', e => {
      // Let app quit when the cleanup is finished

      if (resourcesCleanUpDone) { return }

      e.preventDefault()
      cleanUpResources().finally(() => {
        // Quit AFTER the resources cleanup is finished
        // Which calls the listener again, which is why we have the variable

        app.quit()
      })
    })
  }

  async function cleanUpResources() {
    if (resourcesCleanUpDone) {
      return
    }

    await Promise.allSettled([
      baseHandlers.compactAllDatastores(),
      session.defaultSession.clearCache(),
      session.defaultSession.clearStorageData({
        storages: [
          'appcache',
          'cookies',
          'filesystem',
          'indexdb',
          'shadercache',
          'websql',
          'serviceworkers',
          'cachestorage'
        ]
      })
    ])

    resourcesCleanUpDone = true
  }

  // MacOS event
  // https://www.electronjs.org/docs/latest/api/app#event-activate-macos
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  /*
   * Callback when processing a freetube:// link (macOS)
   */
  app.on('open-url', (event, url) => {
    event.preventDefault()

    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(IpcChannels.OPEN_URL, baseUrl(url))
    } else {
      startupUrl = baseUrl(url)
    }
  })

  app.on('web-contents-created', (_, webContents) => {
    webContents.once('destroyed', () => {
      invidiousAuthorizations.delete(webContents.id)
    })
  })

  /*
   * Check if an argument was passed and send it over to the GUI (Linux / Windows).
   * Remove freetube:// protocol if present
   */
  const url = getLinkUrl(process.argv)
  if (url) {
    startupUrl = url
  }

  function baseUrl(arg) {
    let newArg = arg.replace('freetube://', '')
    // add support for authority free url
      .replace('freetube:', '')

    // fix for Qt URL, like `freetube://https//www.youtube.com/watch?v=...`
    // For details see https://github.com/FreeTubeApp/FreeTube/pull/3119
    if (newArg.startsWith('https') && newArg.charAt(5) !== ':') {
      newArg = 'https:' + newArg.substring(5)
    }
    return newArg
  }

  function getLinkUrl(argv) {
    if (argv.length > 1) {
      return baseUrl(argv[argv.length - 1])
    } else {
      return null
    }
  }

  /*
   * Auto Updater
   *
   * Uncomment the following code below and install `electron-updater` to
   * support auto updating. Code Signing with a valid certificate is required.
   * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
   */

  /*
  import { autoUpdater } from 'electron-updater'
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
  })

  app.on('ready', () => {
    if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
  })
   */

  function navigateTo(path, browserWindow) {
    if (browserWindow == null) {
      return
    }

    browserWindow.webContents.send(
      IpcChannels.CHANGE_VIEW,
      { route: path }
    )
  }

  async function setMenu() {
    const sidenavSettings = baseHandlers.settings._findSidenavSettings()
    const hideTrendingVideos = (await sidenavSettings.hideTrendingVideos)?.value
    const hidePopularVideos = (await sidenavSettings.hidePopularVideos)?.value
    const backendFallback = (await sidenavSettings.backendFallback)?.value
    const backendPreference = (await sidenavSettings.backendPreference)?.value
    const hidePlaylists = (await sidenavSettings.hidePlaylists)?.value

    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+N',
            click: (_menuItem, _browserWindow, _event) => {
              createWindow({
                replaceMainWindow: false,
                showWindowNow: true
              })
            },
            type: 'normal'
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/settings', browserWindow)
            },
            type: 'normal'
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'cut' },
          {
            role: 'copy',
            accelerator: 'CmdOrCtrl+C',
            selector: 'copy:'
          },
          {
            role: 'paste',
            accelerator: 'CmdOrCtrl+V',
            selector: 'paste:'
          },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          {
            role: 'forcereload',
            accelerator: 'CmdOrCtrl+Shift+R'
          },
          { role: 'toggledevtools' },
          { role: 'toggledevtools', accelerator: 'f12', visible: false },
          {
            label: 'Enter Inspect Element Mode',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: (_, window) => {
              if (window.webContents.isDevToolsOpened()) {
                window.devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()')
              } else {
                window.webContents.once('devtools-opened', () => {
                  window.devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()')
                })
                window.webContents.openDevTools()
              }
            }
          },
          {
            label: 'GPU Internals (chrome://gpu)',
            click() {
              const gpuWindow = new BrowserWindow({
                show: true,
                autoHideMenuBar: true,
                webPreferences: {
                  devTools: false
                }
              })
              gpuWindow.loadURL('chrome://gpu')
            }
          },
          { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'resetzoom', accelerator: 'CmdOrCtrl+num0', visible: false },
          { role: 'zoomin', accelerator: 'CmdOrCtrl+Plus' },
          { role: 'zoomin', accelerator: 'CmdOrCtrl+=', visible: false },
          { role: 'zoomin', accelerator: 'CmdOrCtrl+numadd', visible: false },
          { role: 'zoomout' },
          { role: 'zoomout', accelerator: 'CmdOrCtrl+numsub', visible: false },
          { type: 'separator' },
          { role: 'togglefullscreen' },
          { type: 'separator' },
          {
            label: 'Back',
            accelerator: 'Alt+Left',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.navigationHistory.goBack()
            },
            type: 'normal',
          },
          {
            label: 'Forward',
            accelerator: 'Alt+Right',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.navigationHistory.goForward()
            },
            type: 'normal',
          },
        ]
      },
      {
        label: 'Navigate',
        submenu: [
          {
            label: 'Subscriptions',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/subscriptions', browserWindow)
            },
            type: 'normal'
          },
          {
            label: 'Channels',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/subscribedchannels', browserWindow)
            },
            type: 'normal'
          },
          !hideTrendingVideos && {
            label: 'Trending',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/trending', browserWindow)
            },
            type: 'normal'
          },
          (!hidePopularVideos && (backendFallback || backendPreference === 'invidious')) && {
            label: 'Most Popular',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/popular', browserWindow)
            },
            type: 'normal'
          },
          !hidePlaylists && {
            label: 'Playlists',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/userplaylists', browserWindow)
            },
            type: 'normal'
          },
          {
            label: 'History',
            // MacOS: Command + Y
            // Other OS: Ctrl + H
            accelerator: process.platform === 'darwin' ? 'Cmd+Y' : 'Ctrl+H',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/history', browserWindow)
            },
            type: 'normal'
          },
          {
            label: 'Profile Manager',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/settings/profile/', browserWindow)
            },
            type: 'normal'
          },
        ].filter((v) => v !== false),
      },
      {
        role: 'window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ]

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      })

      template.push(
        { role: 'window' },
        { role: 'help' },
        { role: 'services' }
      )
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}
