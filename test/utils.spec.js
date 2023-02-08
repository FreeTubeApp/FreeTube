import { otherAPI } from '../src/renderer/helpers/utils'
import { describe, expect, test } from '@jest/globals'

describe('otherAPI', () => {
  test('returns \'invidious\' when given \'local\'', () => {
    expect(otherAPI('local')).toEqual('invidious')
  })
  test('returns \'local\' when given \'invidious\'', () => {
    expect(otherAPI('invidious')).toEqual('local')
  })
})
