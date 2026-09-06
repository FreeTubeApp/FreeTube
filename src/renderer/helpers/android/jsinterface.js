import android from 'android'

/**
 *
 * @param {string} id the result of a js interface async function
 * @returns {Promise<string>}
 */
export function awaitAsyncResult(id) {
  return new Promise((resolve, reject) => {
    const resolveWrapper = () => {
      resolve(android.getSyncMessage(id))
      window.removeEventListener(`${id}-resolve`, resolveWrapper)
      window.removeEventListener(`${id}-reject`, rejectWrapper)
    }
    window.addEventListener(`${id}-resolve`, resolveWrapper)
    const rejectWrapper = () => {
      reject(android.getSyncMessage(id))
      window.removeEventListener(`${id}-resolve`, resolveWrapper)
      window.removeEventListener(`${id}-reject`, rejectWrapper)
    }
    window.addEventListener(`${id}-reject`, rejectWrapper)
  })
}
