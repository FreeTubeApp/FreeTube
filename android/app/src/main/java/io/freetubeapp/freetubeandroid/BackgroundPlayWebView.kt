package io.freetubeapp.freetubeandroid

import android.content.Context
import android.util.AttributeSet
import android.webkit.WebView

class BackgroundPlayWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : WebView(context, attrs) {
    private var initialized = false

    override fun onWindowVisibilityChanged(visibility: Int) {
        if (initialized) return
        if (visibility != GONE) super.onWindowVisibilityChanged(VISIBLE)
        initialized = true
    }
}
