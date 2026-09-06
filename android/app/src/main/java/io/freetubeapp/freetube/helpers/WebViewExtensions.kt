package io.freetubeapp.freetube.helpers

import android.webkit.WebView

fun WebView.spoofDesktopUserAgent() {
  settings.userAgentString = settings.userAgentString
    .replace(Regex("Mozilla/5.0 \\([^)]*\\)"), "Mozilla/5.0 (X11; Linux x86_64)")
    .replace("Mobile Safari", "Safari")
}
