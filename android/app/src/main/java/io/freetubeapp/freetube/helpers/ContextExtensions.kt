package io.freetubeapp.freetube.helpers

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.Intent.EXTRA_KEY_EVENT
import android.media.session.MediaSession
import android.media.session.PlaybackState.STATE_PLAYING
import android.os.Build
import android.view.KeyEvent
import android.view.KeyEvent.KEYCODE_MEDIA_NEXT
import android.view.KeyEvent.KEYCODE_MEDIA_PAUSE
import android.view.KeyEvent.KEYCODE_MEDIA_PLAY
import android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS
import androidx.core.app.NotificationManagerCompat
import androidx.core.net.toUri
import androidx.documentfile.provider.DocumentFile
import io.freetubeapp.freetube.MainActivity
import io.freetubeapp.freetube.MediaControlsReceiver
import io.freetubeapp.freetube.R
import java.io.File

fun Context.createNotificationChannel(channelId: String): NotificationChannel {
  val notificationManager = NotificationManagerCompat.from(this)
  val channel = notificationManager.getNotificationChannel(channelId, "Media Controls")
    ?: NotificationChannel(channelId, "Media Controls", NotificationManager.IMPORTANCE_MIN)

  channel.lockscreenVisibility = Notification.VISIBILITY_PRIVATE
  notificationManager.createNotificationChannel(channel)
  return channel
}

fun Context.createMediaSession(channelId: String, dispatchEvent: (String) -> Unit, updatePos: (Long) -> Unit): MediaSession {
  // add the callbacks && listeners
  val session = MediaSession(this, channelId)
  session.isActive = true

  session.setCallback(object : MediaSession.Callback() {
    override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {
      val keyEvent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        mediaButtonIntent.extras?.getParcelable(EXTRA_KEY_EVENT, KeyEvent::class.java)
      } else {
        @Suppress("DEPRECATION")
        mediaButtonIntent.extras?.getParcelable(EXTRA_KEY_EVENT)
      }
      return if (keyEvent == null) {
        super.onMediaButtonEvent(mediaButtonIntent)
      } else {
        when (keyEvent.keyCode) {
          KEYCODE_MEDIA_PLAY -> {
            dispatchEvent("media-play")
          }
          KEYCODE_MEDIA_PAUSE -> {
            dispatchEvent("media-pause")
          }
          KEYCODE_MEDIA_NEXT -> {
            dispatchEvent("media-next")
          }
          KEYCODE_MEDIA_PREVIOUS -> {
            dispatchEvent("media-previous")
          }
        }
        false
      }
    }

    override fun onSkipToNext() {
      super.onSkipToNext()
      dispatchEvent("media-next")
    }

    override fun onSkipToPrevious() {
      super.onSkipToPrevious()
      dispatchEvent("media-previous")
    }

    override fun onSeekTo(pos: Long) {
      super.onSeekTo(pos)
      updatePos(pos)
    }

    override fun onPlay() {
      super.onPlay()
      dispatchEvent("media-play")
    }

    override fun onPause() {
      super.onPause()
      dispatchEvent("media-pause")
    }
  })

  return session
}


fun Context.getMediaControlsIntent(action: String): Intent {
  return Intent(
    this,
    MediaControlsReceiver::class.java
  ).setAction(action)
}

fun Context.getAction(icon: Int, label: String, action: String): Notification.Action {
  @Suppress("DEPRECATION")
  return Notification.Action.Builder(
    icon,
    label,
    PendingIntent.getBroadcast(
      this, 1,
      getMediaControlsIntent(action),
      PendingIntent.FLAG_IMMUTABLE
    )
  ).build()
}

@SuppressLint("PrivateResource")
fun Context.getBack(): Notification.Action {
  return getAction(
    androidx.media3.ui.R.drawable.exo_ic_skip_previous,
    "Back",
    "previous"
  )
}

@SuppressLint("PrivateResource")
fun Context.getNext(): Notification.Action {
  return getAction(
    androidx.media3.ui.R.drawable.exo_ic_skip_next,
    "Next",
    "next"
  )
}

@SuppressLint("PrivateResource")
fun Context.getPause(): Notification.Action {
  return getAction(
    androidx.media3.ui.R.drawable.exo_icon_pause,
    "Pause",
    "pause"
  )
}

@SuppressLint("PrivateResource")
fun Context.getPlay(): Notification.Action {
  return getAction(
    androidx.media3.ui.R.drawable.exo_icon_play,
    "Play",
    "play"
  )
}

fun Context.getPlayPause(state: Int): Notification.Action {
  return if (state == STATE_PLAYING) {
    // this is intentionally reversed, because for some reason, this works?
    getPause()
  } else {
    getPlay()
  }
}

fun Context.createNotification(session: MediaSession, channelId: String, state: Int): Notification {
  val style = Notification.MediaStyle()
    .setMediaSession(session.sessionToken).setShowActionsInCompactView(0, 1, 2)

  return Notification.Builder(this, channelId)
    .setStyle(style)
    .setSmallIcon(R.drawable.ic_media_notification_icon)
    .setContentIntent(
      PendingIntent.getActivity(
        this,
        1,
        Intent(Intent.ACTION_MAIN)
          .addCategory(Intent.CATEGORY_LAUNCHER)
          .setClass(this,  MainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    )
    .setDeleteIntent(
      PendingIntent.getBroadcast(
        this,
        1,
        getMediaControlsIntent( "pause"),
        PendingIntent.FLAG_IMMUTABLE
      )
    )
    .addAction(getBack())
    .addAction(getPlayPause(state))
    .addAction(getNext())
    .setVisibility(Notification.VISIBILITY_PUBLIC)
    .build()
}

fun Context.getDataDirectory(): String? {
  return getExternalFilesDir(null)?.parent
}

fun Context.resolveAmbiguousUri(givenUri: String): DocumentFile? {
  return  if (givenUri.startsWith("data://")) {
    val path = givenUri.split("data://")[1]
    DocumentFile.fromFile(File(getDataDirectory(), path))
  } else {
    DocumentFile.fromSingleUri(this, givenUri.toUri())
  }
}
