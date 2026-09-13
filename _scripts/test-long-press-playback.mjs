import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile('src/renderer/components/ft-shaka-video-player/ft-shaka-video-player.js', 'utf8')

assert.match(source, /if \(!process\.env\.IS_ANDROID \|\| event\.pointerType === 'mouse' \|\| video\.value\.paused\) return/)
assert.match(source, /longPressTimer = setTimeout\(\(\) => \{/)
assert.match(source, /video\.value\.playbackRate = Math\.min\(2, maxVideoPlaybackRate\.value\)/)
assert.match(source, /controlsContainer\.addEventListener\('pointerdown', startLongPressPlayback\)/)
assert.match(source, /controlsContainer\.addEventListener\('pointerup', stopLongPressPlayback\)/)
assert.match(source, /controlsContainer\.addEventListener\('pointercancel', stopLongPressPlayback\)/)
assert.match(source, /customContextMenu: !process\.env\.IS_ANDROID/)
assert.match(source, /contextMenuElements: process\.env\.IS_ANDROID \? \[\] : \['ft_stats'\]/)
assert.match(source, /if \(!process\.env\.IS_ANDROID\) \{\n\s+shakaContextMenu\.registerElement\('ft_stats', new StatsButtonFactory\(\)\)/)
assert.match(source, /shakaOverflowMenu\.registerElement\('ft_stats', new StatsButtonFactory\(\)\)/)
assert.match(source, /ignoreErrors = true\n\s+removeLongPressPlaybackListeners\(\)/)

console.log('long-press playback contract: PASS')
