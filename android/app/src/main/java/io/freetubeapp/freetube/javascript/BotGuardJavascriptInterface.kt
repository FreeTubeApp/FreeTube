package io.freetubeapp.freetube.javascript

import android.webkit.JavascriptInterface
import io.freetubeapp.freetube.helpers.Promise

class BotGuardJavascriptInterface {
  lateinit var resolve: (String) -> Unit
  lateinit var reject: (String) -> Unit
  var promise: Promise<String, String> = Promise {
    resolve, reject ->
      this.resolve = resolve
      this.reject = reject
  }

  @JavascriptInterface
  fun returnToken(token: String) {
    resolve(token)
  }

  @JavascriptInterface
  fun rejectToken(error: String) {
    reject(error)
  }

  fun onReturn(callback: (String) -> Unit) {
    promise.then(callback)
  }

  fun onReject(callback: (String) -> Unit) {
    promise.catch(callback)
  }
}
