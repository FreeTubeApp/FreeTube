package io.freetubeapp.freetube.webviews

import android.content.Context
import android.util.AttributeSet
import android.webkit.WebView

open class BackgroundPlayWebView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null
) : WebView(context, attrs) {
  private var once: Boolean = false
  override fun onWindowVisibilityChanged(visibility: Int) {
    if (once) return
    if (visibility != GONE) super.onWindowVisibilityChanged(VISIBLE)
    once = true
  }
}
