// code shared between invidious and local api (like parsing or types)
export function parseVideoClipsParams(videoId, params) {
  if (process.env.SUPPORTS_LOCAL_API) {
    const { Utils } = require('youtubei.js')
    const { ClipParams } = require('../../../../node_modules/youtubei.js/dist/protos/generated/misc/params')

    const parsedParams = ClipParams.decode(Utils.base64ToU8(decodeURIComponent(params)))

    return {
      videoId,
      startTime: parsedParams.clipParamData.startTime / 1000, // convert to seconds
      endTime: parsedParams.clipParamData.endTime / 1000, // convert to seconds
      clipTitle: parsedParams.clipParamData.clipTitle,
      clipMetadata: parsedParams.clipParamData.clipMetadata
    }
  } else {
    return null
  }
}
