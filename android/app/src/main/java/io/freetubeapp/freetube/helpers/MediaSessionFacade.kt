package io.freetubeapp.freetube.helpers

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.BitmapFactory
import android.media.MediaMetadata
import android.media.session.PlaybackState
import android.media.session.PlaybackState.STATE_BUFFERING
import android.media.session.PlaybackState.STATE_PAUSED
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import io.freetubeapp.freetube.MediaControlsReceiver
import io.freetubeapp.freetube.javascript.dispatchEvent
import java.net.URL

// 🤫 pay no attention to the one behind the curtain
class MediaSessionFacade(
  private val context: Context,
  private val channelId: String,
  dispatchMediaEvent: (String) -> Unit = {},
  dispatchPositionEvent: (Long) -> Unit = {},
  private var state: Int = STATE_PAUSED,
  private val notificationId: Int = (2..1000).random(),
  private val notificationTag: String = "media_controls"
) {
  init {
    context.createNotificationChannel(channelId)
    MediaControlsReceiver.notifyMediaSessionListeners = { action ->
      dispatchMediaEvent("media-$action")
    }
  }

  private val notificationManager = NotificationManagerCompat.from(context)
  private val session = context.createMediaSession(
    channelId,
    { event ->
      dispatchMediaEvent(event)
    },
    { position ->
      setState(STATE_BUFFERING, position)
      dispatchPositionEvent(position)
    }
  )
  private var notification = context.createNotification(session, channelId, state)
  private var playbackPosition: Long? = null

  @SuppressLint("MissingPermission")
  fun push() {
    // AFAIK you don't need permission to push a media session notification
    notificationManager.notify(notificationTag, notificationId, notification)
  }

  /**
   * sets the state of the active media session
   * @param givenState the state; should be an Int (as a string because the java bridge)
   * @param givenPosition the position; should be a Long (as a string because the java bridge)
   */
  fun setState(givenState: Int?, givenPosition: Long? = null): MediaSessionFacade {
    if (givenState != null) {
      state = givenState
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      // recreate media notification
      notification = context.createNotification(session, channelId, state)
      push()
    }

    val statePosition: Long? = givenPosition ?: playbackPosition
    playbackPosition = statePosition
    session.setPlaybackState(
      PlaybackState.Builder()
        .setState(state, statePosition ?: 0, 0.0f)
        .setActions(
          PlaybackState.ACTION_PLAY_PAUSE or
          PlaybackState.ACTION_PAUSE or
          PlaybackState.ACTION_SKIP_TO_NEXT or
          PlaybackState.ACTION_SKIP_TO_PREVIOUS or
          PlaybackState.ACTION_PLAY_FROM_MEDIA_ID or
          PlaybackState.ACTION_PLAY_FROM_SEARCH or
          PlaybackState.ACTION_SEEK_TO
        ).build()
    )
    return this
  }

  /**
   * sets the metadata of the active media session
   * @param trackName the video title
   * @param artist the channel name
   * @param duration the length of the video in milliseconds
   * @param art the URL to the video thumbnail
   */
  fun setMetadata(
    trackName: String,
    artist: String,
    duration: Long,
    art: String?
  ): MediaSessionFacade {
    val metadataBuilder = MediaMetadata.Builder()

    if (art != null) {
      try {
        val connection = URL(art).openConnection()
        connection.connect()

        val input = connection.getInputStream()
        val bitmapArt = BitmapFactory.decodeStream(input)

        metadataBuilder
          .putBitmap(MediaMetadata.METADATA_KEY_ART, bitmapArt)
          .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmapArt)
      } catch (ex: Throwable) {
        ex.printStackTrace()
      }
    }

    session.setMetadata(
      metadataBuilder
        .putString(MediaMetadata.METADATA_KEY_TITLE, trackName)
        .putString(MediaMetadata.METADATA_KEY_ARTIST, artist)
        .putLong(MediaMetadata.METADATA_KEY_DURATION, duration)
        .build()
    )

    return this
  }

  /**
   * cancels the active media notification
   */
  fun cancel() {
    notificationManager.cancelAll()
  }
}
