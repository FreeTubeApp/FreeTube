import android from 'android'
import { awaitAsyncResult } from './jsinterface'
import i18n from '../../i18n'

export async function generatePOToken(videoId, sessionContext, initialAttestationData, ytConfig) {
  const id = android.generatePOToken(videoId, sessionContext, initialAttestationData, ytConfig)
  return await awaitAsyncResult(id)
}

export async function runDecipherScript(id, code, timeout = 10000) {
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(i18n.global.t('Decipher Script Timed Out'))), timeout)
  })
  const result = await Promise.race([
    awaitAsyncResult(android.runDecipherScript(id, code, timeout)),
    timeoutPromise
  ])
  return JSON.parse(result)
}
