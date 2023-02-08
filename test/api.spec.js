import { expect, jest, describe, test } from '@jest/globals'
import { channelShorts } from '../src/renderer/helpers/api'
import sinon from 'sinon'
import * as invidiousAPI from '../src/renderer/helpers/api/invidious'
import * as localAPI from '../src/renderer/helpers/api/local'

const ytch = require('yt-channel-info')

const channelId = 'FOO123455'
const idType = 'normal'
const sortBy = 'newest'
const continuation = '4qmFsgL3ARIYVUN5VmlCZllKS0VTdlBPSUZSQlQyeW1nGtoBOGdhZEFScWFBVktYQVFxU0FRcHFRME00VVVGU2IyNXZaMWxyUTJob1ZsRXpiRmRoVlVwdFYxVndURkpXVGpKVlJUbEtVbXhLUTFaRVNqVmlWMk5SUVZKdlEwTkJRV2xCWjJkQlNXaEZTMFI2UlRaTlZGa3pUbFJaTVUxcVdUSk5SR2N3VGxOdlRrTm5jM2RXUld4RVRrVTBNRkY2YUdaVlVSSWtOak5sWkRBM01ETXRNREF3TUMweU5EYzBMVGswWVdNdE1UUXlNak5pWXpVM05UQmhHQUUlM0Q%3'

describe('Channel functions', () => {
  describe('channelShorts generic', () => {
    test('uses Invidious or YT, depending upon API parameter', async () => {
      const spyChannelShortsYT = jest.spyOn(localAPI, 'channelShortsLocal').mockImplementation(async () => {
        return { items: [], continuation: '' }
      })

      const spyChannelShortsIV = jest.spyOn(invidiousAPI, 'channelShortsInvidious').mockImplementation(async () => {
        return { videos: [], continuation: '' }
      })

      await channelShorts('local', channelId, idType, sortBy)
      expect(spyChannelShortsYT).toHaveBeenCalledWith(channelId, idType, sortBy)
      await channelShorts('invidious', channelId, idType, sortBy)
      expect(spyChannelShortsIV).toHaveBeenCalledWith(channelId, idType, sortBy)

      spyChannelShortsYT.mockRestore()
      spyChannelShortsIV.mockRestore()
    })
    test('returns an object with shorts and a continuation string', async () => {
      const ytchChannelSpy = jest.spyOn(ytch, 'getChannelShorts').mockImplementation(async () => {
        return {
          items: [], continuation
        }
      })
      const result = await channelShorts('local', channelId, idType, null)
      expect(result).toHaveProperty('shorts')
      expect(result).toHaveProperty('continuationString', continuation)
      ytchChannelSpy.mockRestore()
    })
  })
  describe('response parsing', () => {
    test('Local #parseShortsResponse returns an object with shorts and continuation', () => {
      expect(localAPI.parseShortsResponse({
        items: [], continuation
      })).toEqual({ shorts: [], continuationString: continuation })
    })
    test('Invidious #parseShortsResponse returns an object with shorts and continuation', () => {
      expect(invidiousAPI.parseShortsResponse({
        videos: [], continuation
      })).toEqual({ shorts: [], continuationString: continuation })
    })
  })
  describe('#channelShortsInvidious', () => {
    test('passes Invidious style params using channelId', async () => {
      const payload = {
        resource: `channels/${channelId}/shorts`, id: '', params: { sortBy }
      }
      const spyInvidiousAPICall = sinon.replace(invidiousAPI, 'invidiousAPICall', sinon.fake(async () => {
      }))
      await invidiousAPI.channelShortsInvidious(channelId, idType, sortBy)
      expect(spyInvidiousAPICall.calledWith(payload)).toEqual(true)
      sinon.restore()
    })
  })
  describe('#channelShortsLocal', () => {
    test('passes YouTube style params using channelId', async () => {
      const spyYtchCall = sinon.replace(ytch, 'getChannelShorts', sinon.fake())
      await localAPI.channelShortsLocal(channelId, idType, sortBy)
      expect(spyYtchCall.called).toEqual(true)
      sinon.restore()
    })
  })
})
