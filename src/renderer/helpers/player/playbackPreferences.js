function parseVolume(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') {
    return null
  }

  const volume = Number(value)

  if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
    return null
  }

  return volume
}

export function resolvePlaybackRate(lastPlaybackRate, defaultPlayback, maxPlaybackRate) {
  const savedRate = Number(lastPlaybackRate)
  const defaultRate = Number(defaultPlayback)
  const maxRate = Number(maxPlaybackRate)
  const playbackRate = Number.isFinite(savedRate) && savedRate > 0
    ? savedRate
    : Number.isFinite(defaultRate) && defaultRate > 0
      ? defaultRate
      : 1

  return Number.isFinite(maxRate) && maxRate > 0
    ? Math.min(playbackRate, maxRate)
    : playbackRate
}

export function createVolumePreference(volume, muted) {
  if (!Number.isFinite(volume) || volume < 0 || volume > 1 || typeof muted !== 'boolean') {
    return null
  }

  return { volume, muted }
}

export function resolveVolumePreference(lastVolume, sessionVolume, sessionMuted, defaultVolume) {
  const storedVolume = lastVolume && parseVolume(lastVolume.volume)
  if (storedVolume !== null && typeof lastVolume.muted === 'boolean') {
    return { volume: storedVolume, muted: lastVolume.muted }
  }

  const previousVolume = parseVolume(sessionVolume)
  if (previousVolume !== null && (sessionMuted === 'true' || sessionMuted === 'false')) {
    return { volume: previousVolume, muted: sessionMuted === 'true' }
  }

  const configuredVolume = parseVolume(defaultVolume)
  if (configuredVolume === null) {
    return null
  }

  return { volume: configuredVolume, muted: configuredVolume === 0 }
}

export function resolveCaptionPreference(preference, textTracks, defaultEnabled) {
  if (preference && typeof preference.enabled === 'boolean') {
    if (!preference.enabled) {
      return { shouldApply: true, track: null }
    }

    if (typeof preference.language === 'string') {
      const language = preference.language.toLowerCase()
      const track = textTracks.find(track => typeof track.language === 'string' && track.language.toLowerCase() === language)

      return { shouldApply: Boolean(track), track: track || null }
    }

    return { shouldApply: textTracks.length > 0, track: textTracks[0] || null }
  }

  if (defaultEnabled) {
    return { shouldApply: textTracks.length > 0, track: textTracks[0] || null }
  }

  return { shouldApply: false, track: null }
}

export function createCaptionPreference(textTracks) {
  const activeTrack = textTracks.find(track => track.active)

  return {
    enabled: Boolean(activeTrack),
    language: activeTrack?.language || null
  }
}

export function createCaptionPreferenceState(initialPreference) {
  let preference = initialPreference && typeof initialPreference.enabled === 'boolean'
    ? initialPreference
    : null

  return {
    hasPreference() {
      return preference !== null
    },
    update(textTracks) {
      preference = createCaptionPreference(textTracks)
      return preference
    },
    resolve(textTracks, defaultEnabled) {
      return resolveCaptionPreference(preference, textTracks, defaultEnabled)
    }
  }
}
