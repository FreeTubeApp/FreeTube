package io.freetubeapp.freetube.webviews

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import io.freetubeapp.freetube.javascript.AsyncJSCommunicator
import io.freetubeapp.freetube.javascript.SigWebViewJavascriptInterface
import org.json.JSONObject

@SuppressLint("ViewConstructor")
class SigWebView(
  context: Context,
  communicator: AsyncJSCommunicator,
  onConsoleMessage: (JSONObject) -> Unit
) : BackgroundPlayWebView(context, null) {
  val jsInterface = SigWebViewJavascriptInterface(this, communicator)

  var onLoad: SigWebView.() -> Unit = {}

  init {
    addJavascriptInterface(jsInterface, "Android")

    @SuppressLint("SetJavaScriptEnabled")
    settings.javaScriptEnabled = true
    settings.allowFileAccess = true

    (context as Activity).runOnUiThread {
      loadUrl("file:///android_asset/decipher.html")
    }

    webViewClient = object : WebViewClient() {
      override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
      ): WebResourceResponse? {
        return null
      }

      override fun onPageFinished(view: WebView?, url: String?) {
        onLoad()
        super.onPageFinished(view, url)
      }
    }

    webChromeClient = ConsoleLogChromeClient(onConsoleMessage)
  }
}
