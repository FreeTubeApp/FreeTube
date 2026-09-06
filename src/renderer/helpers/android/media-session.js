import android from 'android'

export const STATE_PLAYING = 3
export const STATE_PAUSED = 2
export const STATE_BUFFERING = 6

export function createMediaSession(title, artist, duration, cover = null) {
  android.createMediaSession(title, artist, duration, cover)
}

export function updateMediaSessionState(state, position = null) {
  android.updateMediaSessionState(state?.toString() || null, position?.toString() || null)
}
