package io.freetubeapp.freetubeandroid

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class MediaControlsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        intent?.action?.let { onAction?.invoke(it) }
    }

    companion object {
        var onAction: ((String) -> Unit)? = null
    }
}
