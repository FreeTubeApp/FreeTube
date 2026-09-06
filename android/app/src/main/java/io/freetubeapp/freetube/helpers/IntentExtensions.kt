package io.freetubeapp.freetube.helpers

import android.content.Intent

fun Intent.toYtUrl(): String? {
  val uri = data
  val isYT =
    uri?.host == "www.youtube.com" || uri?.host == "youtube.com" || uri?.host == "m.youtube.com" || uri?.host == "youtu.be"
  return if (!isYT) {
    uri?.toString()?.replace(uri.host.toString(), "www.youtube.com")
  } else {
    uri?.toString()
  }
}
