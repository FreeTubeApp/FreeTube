const { createHash } = require('crypto')
const { readFileSync } = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const PLUGIN_NAME = 'FreeTubePwaPlugin'

const SERVICE_WORKER_FILENAME = 'sw.js'

// Leftovers of an old, non-functional PWA setup in the upstream web build.
// They get replaced by the files in this directory.
const LEGACY_ASSETS = ['pwabuilder-sw.js', 'static/manifest.json']
const LEGACY_MANIFEST_LINK = /<link\b[^>]*\brel=["']?manifest\b[^>]*>/g
const LEGACY_SW_REGISTRATION = /<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?serviceWorker[\s\S]*?<\/script>/g
const LEFTOVERS = /serviceWorker|\brel=["']?manifest\b/

// Not precached because of their size or because they can change without a new build (pwa-config.js),
// the service worker caches them at runtime once they get requested
const RUNTIME_CACHED_PREFIXES = ['static/locales/', 'static/geolocations/', 'static/shaka-player-locales/', 'pwa-config.js']
const EXCLUDED_FROM_PRECACHE = /(?:\.LICENSE\.txt|\.map)$/

const HEAD_TAGS = [
  ['link', { rel: 'manifest', href: 'manifest.webmanifest' }],
  ['link', { rel: 'icon', type: 'image/svg+xml', href: 'icons/icon.svg' }],
  ['link', { rel: 'apple-touch-icon', href: 'icons/icon-512.png' }],
  ['meta', { name: 'description', content: 'A private YouTube client' }],
  ['meta', { name: 'theme-color', content: '#212121' }],
  ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
  ['meta', { name: 'apple-mobile-web-app-title', content: 'FreeTube' }],
  // Not deferred, so that the configuration is available before the app (web.js, deferred) runs
  ['script', { src: 'pwa-config.js' }],
  ['script', { defer: true, src: 'register-sw.js' }],
]

/**
 * Turns the upstream web build into an installable PWA:
 * - replaces the legacy manifest link and service worker registration in index.html
 * - generates a service worker that precaches the build output
 */
class FreeTubePwaPlugin {
  /**
   * @param {{ serviceWorkerTemplate: string }} options
   */
  constructor ({ serviceWorkerTemplate }) {
    this.serviceWorkerTemplate = serviceWorkerTemplate
  }

  /** @param {import('webpack').Compiler} compiler */
  apply (compiler) {
    const { Compilation, WebpackError, sources } = compiler.webpack

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tap(PLUGIN_NAME, (data) => {
        data.html = data.html
          .replaceAll(LEGACY_MANIFEST_LINK, '')
          .replaceAll(LEGACY_SW_REGISTRATION, '')

        // Fail loudly if upstream changed the template in a way that the patterns above no longer match,
        // two service workers or manifests competing with each other would be hard to debug.
        if (LEFTOVERS.test(data.html)) {
          compilation.errors.push(new WebpackError(
            `${PLUGIN_NAME}: ${data.outputName} still contains a service worker registration or manifest link ` +
            'after removing the upstream ones. The upstream template (src/index.ejs) probably changed, ' +
            'please update the patterns in pwa/FreeTubePwaPlugin.js.'
          ))
        }

        data.headTags.push(...HEAD_TAGS.map(([tagName, attributes]) => {
          return HtmlWebpackPlugin.createHtmlTagObject(tagName, attributes, undefined, { plugin: PLUGIN_NAME })
        }))

        return data
      })

      compilation.hooks.processAssets.tap({
        name: PLUGIN_NAME,
        // Runs after all other assets are final (e.g. index.html from html-webpack-plugin and real content hashes)
        stage: Compilation.PROCESS_ASSETS_STAGE_REPORT
      }, () => {
        for (const name of LEGACY_ASSETS) {
          if (compilation.getAsset(name)) {
            compilation.deleteAsset(name)
          }
        }

        const precache = []
        let precacheSize = 0

        for (const { name, source } of compilation.getAssets()) {
          if (
            name === SERVICE_WORKER_FILENAME ||
            EXCLUDED_FROM_PRECACHE.test(name) ||
            RUNTIME_CACHED_PREFIXES.some(prefix => name.startsWith(prefix))
          ) {
            continue
          }

          const buffer = source.buffer()
          precache.push({
            url: name,
            revision: createHash('sha256').update(buffer).digest('hex').slice(0, 16)
          })
          precacheSize += buffer.length
        }

        precache.sort((a, b) => a.url.localeCompare(b.url))

        const version = createHash('sha256')
          .update(JSON.stringify(precache))
          .digest('hex')
          .slice(0, 16)

        const serviceWorker = `const FT_VERSION = ${JSON.stringify(version)}\n` +
          `const FT_PRECACHE_URLS = ${JSON.stringify(precache.map(entry => entry.url))}\n\n` +
          readFileSync(this.serviceWorkerTemplate, 'utf-8')

        compilation.emitAsset(SERVICE_WORKER_FILENAME, new sources.RawSource(serviceWorker))

        compilation.getLogger(PLUGIN_NAME).info(
          `Service worker version ${version}: precaching ${precache.length} files (${(precacheSize / 1024 / 1024).toFixed(1)} MiB)`
        )
      })
    })
  }
}

module.exports = FreeTubePwaPlugin
