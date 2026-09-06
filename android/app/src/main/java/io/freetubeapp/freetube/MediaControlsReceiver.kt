package io.freetubeapp.freetube

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

open class MediaControlsReceiver : BroadcastReceiver() {

  companion object Static {
    lateinit var notifyMediaSessionListeners: (String) -> Unit
  }

  override fun onReceive(context: Context?, intent: Intent?) {
    val action = intent?.action
    if (action != null) {
      notifyMediaSessionListeners(action)
    }
  }
}
