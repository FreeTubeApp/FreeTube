package io.freetubeapp.freetube.helpers

import android.content.res.Configuration

fun Configuration.isDarkMode(): Boolean {
  return when (uiMode and Configuration.UI_MODE_NIGHT_MASK) {
    Configuration.UI_MODE_NIGHT_NO -> {
      false
    }
    Configuration.UI_MODE_NIGHT_YES -> {
      true
    }
    else -> {
      false
    }
  }
}
