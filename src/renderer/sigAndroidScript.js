/* global Android */

window.addEventListener('message', (event) => {
  const id = event.id
  const code = Android.readSync(id)
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(code)()
    console.warn(`[Android decipher] ${id}: ${typeof result} ${String(result).slice(0, 120)}`)
    Android.resolve(id, JSON.stringify(result))
  } catch (error) {
    console.error(`[Android decipher] ${id}: ${error}`)
    Android.reject(id, error.toString())
  }
})
