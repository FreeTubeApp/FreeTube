import { describe, expect, it } from 'vitest'
import {
  createCaptionPreferenceState,
  createVolumePreference,
  createCaptionPreference,
  resolveCaptionPreference,
  resolvePlaybackRate,
  resolveVolumePreference
} from '../../src/renderer/helpers/player/playbackPreferences'

describe('resolvePlaybackRate', () => {
  it('uses the configured default when no playback rate has been saved', () => {
    expect(resolvePlaybackRate(null, 1.25, 3)).toBe(1.25)
  })

  it('caps the saved playback rate at the configured maximum', () => {
    expect(resolvePlaybackRate(3, 1, 2)).toBe(2)
  })
})

describe('resolveVolumePreference', () => {
  it('preserves a zero volume separately from the mute state', () => {
    expect(createVolumePreference(0, false))
      .toEqual({ volume: 0, muted: false })
  })

  it('preserves the mute button state without changing the remembered volume', () => {
    expect(createVolumePreference(0.65, true))
      .toEqual({ volume: 0.65, muted: true })
  })

  it('prefers a valid persisted volume and mute state', () => {
    expect(resolveVolumePreference(
      { volume: 0.35, muted: true },
      '0.8',
      'false',
      1
    )).toEqual({ volume: 0.35, muted: true })
  })

  it('uses the existing session preference when no persisted value exists', () => {
    expect(resolveVolumePreference(null, '0.6', 'false', 1))
      .toEqual({ volume: 0.6, muted: false })
  })

  it('falls back to the configured default when saved values are invalid', () => {
    expect(resolveVolumePreference(
      { volume: null, muted: false },
      null,
      null,
      0.75
    )).toEqual({ volume: 0.75, muted: false })
  })

  it('mutes when the configured default volume is zero', () => {
    expect(resolveVolumePreference(null, null, null, 0))
      .toEqual({ volume: 0, muted: true })
  })
})

describe('resolveCaptionPreference', () => {
  const tracks = [
    { language: 'en', label: 'English' },
    { language: 'pt-BR', label: 'Português' }
  ]

  it('restores a saved language without regard to case', () => {
    expect(resolveCaptionPreference(
      { enabled: true, language: 'PT-br' },
      tracks,
      false
    )).toEqual({ shouldApply: true, track: tracks[1] })
  })

  it('does not change tracks when the saved language is unavailable', () => {
    expect(resolveCaptionPreference(
      { enabled: true, language: 'fr' },
      tracks,
      true
    )).toEqual({ shouldApply: false, track: null })
  })

  it('does not enable subtitles for a video without caption tracks', () => {
    expect(resolveCaptionPreference(
      { enabled: true, language: 'en' },
      [],
      true
    )).toEqual({ shouldApply: false, track: null })
  })

  it('restores an explicit captions-off preference', () => {
    expect(resolveCaptionPreference(
      { enabled: false, language: null },
      tracks,
      true
    )).toEqual({ shouldApply: true, track: null })
  })

  it('uses the existing default only when there is no saved preference', () => {
    expect(resolveCaptionPreference(null, tracks, true))
      .toEqual({ shouldApply: true, track: tracks[0] })
    expect(resolveCaptionPreference(null, tracks, false))
      .toEqual({ shouldApply: false, track: null })
  })

  it('creates a preference from the active caption track', () => {
    expect(createCaptionPreference([
      { language: 'en', active: false },
      { language: 'pt-BR', active: true }
    ])).toEqual({ enabled: true, language: 'pt-BR' })
  })

  it('creates an explicit preference when captions are turned off', () => {
    expect(createCaptionPreference(tracks))
      .toEqual({ enabled: false, language: null })
  })

  it('keeps captions off after a format reload instead of applying the default again', () => {
    const preference = createCaptionPreferenceState(null)

    expect(preference.resolve(tracks, true)).toEqual({ shouldApply: true, track: tracks[0] })

    preference.update([])

    expect(preference.resolve(tracks, true)).toEqual({ shouldApply: true, track: null })
  })

  it('keeps the selected language across a format reload instead of choosing the first track', () => {
    const preference = createCaptionPreferenceState(null)
    const selectedTrack = { language: 'pt-BR', label: 'Português', active: true }
    const tracksAfterFormatChange = [
      { language: 'en', label: 'English' },
      { language: 'pt-BR', label: 'Português' }
    ]

    preference.update([selectedTrack])

    expect(preference.resolve(tracksAfterFormatChange, true))
      .toEqual({ shouldApply: true, track: tracksAfterFormatChange[1] })
  })
})
