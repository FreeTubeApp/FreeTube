package io.freetubeapp.freetube.javascript

import android.webkit.JavascriptInterface
import io.freetubeapp.freetube.webviews.SigWebView

class SigWebViewJavascriptInterface(
  webView: SigWebView,
  private val remoteJSCommunicator: AsyncJSCommunicator
) {
  val jsCommunicator = AsyncJSCommunicator(webView)

  @JavascriptInterface
  fun readSync(id: String): String? {
    return jsCommunicator.getSyncMessage(id)
  }

  @JavascriptInterface
  fun resolve(id: String, message: String) {
    remoteJSCommunicator.resolve(id, message)
  }

  @JavascriptInterface
  fun reject(id: String, message: String) {
    remoteJSCommunicator.reject(id, message)
  }
}
