import {
  Input,
  Output,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  MkvOutputFormat,
  // TextSubtitleSource,
  Conversion
} from 'mediabunny'

async function executeMuxing(entry) {
  let outputFormat
  if (entry.fileFormat === 'MP4') {
    outputFormat = new Mp4OutputFormat()
  } else if (entry.fileFormat === 'MKV') {
    outputFormat = new MkvOutputFormat()
  }

  entry.dl.mediaOutput = new Output({
    format: outputFormat,
    target: new BufferTarget(),
  })

  const inputs = []

  for (const item of entry.items) {
    if (item.mime.startsWith('audio/') || item.mime.startsWith('video/')) {
      item.dl.mediaInput = new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(item.dl.blob),
      })
      inputs.push(item.dl.mediaInput)
    } /* else
    if (item.mime.startsWith('text/')) {
      let textSource = new TextSubtitleSource('webvtt')
      await textSource.add(await item.dl.blob.text())
      textSource.close()
      entry.dl.mediaOutput.addSubtitleTrack(textSource)
    } */
  }

  const conversion = await Conversion.init({
    input: inputs,
    output: entry.dl.mediaOutput
  })

  // console.log('performing conversion ...')
  // conversion.onProgress = (progress) => {
  // console.log('muxing progress: ' + Math.ceil(progress * 100))
  await conversion.execute()
  // console.log('conversion is done')

  // console.log('writing output file ...')
  const writable = await entry.fileHandle.createWritable()
  await writable.write(entry.dl.mediaOutput.target.buffer)
  await writable.close()
  // console.log('download complete')
}

function cleanupEntry(entry) {
  for (const item of entry.items) {
    item.dl.mediaInput = null
    item.dl.blob = null
  }
  entry.dl.mediaOutput = null
}

self.onmessage = ({ data: { entry } }) => {
  self.postMessage({ status: 'muxing' })

  try {
    executeMuxing(entry).then((result) => {
      self.postMessage({ status: 'complete' })
      cleanupEntry(entry)
    }).catch((errMsg) => {
      console.error(errMsg)
      self.postMessage({ status: 'failed' })
      cleanupEntry(entry)
    })
  } catch (errMsg) {
    console.error(errMsg)
    self.postMessage({ status: 'failed' })
    cleanupEntry(entry)
  }
}
