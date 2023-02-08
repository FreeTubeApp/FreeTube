import { TextEncoder } from 'util'
import { clearImmediate } from 'timers'

global.TextEncoder = TextEncoder
global.clearImmediate = clearImmediate
