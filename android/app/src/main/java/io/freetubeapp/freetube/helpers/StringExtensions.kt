package io.freetubeapp.freetube.helpers

import android.graphics.Color
import android.os.Build
import java.net.URLEncoder
import java.nio.charset.Charset

fun String.hexToColour() : Int {
  return when (length) {
      7 -> {
        Color.rgb(
          Integer.valueOf(substring(1, 3), 16),
          Integer.valueOf(substring(3, 5), 16),
          Integer.valueOf(substring(5, 7), 16)
        )
      }
      4 -> {
        val r = substring(1, 2)
        val g = substring(2, 3)
        val b = substring(3, 4)
        Color.rgb(
          Integer.valueOf("$r$r", 16),
          Integer.valueOf("$g$g", 16),
          Integer.valueOf("$b$b", 16)
        )
      }
      else -> {
        Color.TRANSPARENT
      }
  }
}


fun String.urlEncode(): String {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    URLEncoder.encode(this, Charset.defaultCharset())
  } else {
    @Suppress("DEPRECATION")
    URLEncoder.encode(this)
  }
}
