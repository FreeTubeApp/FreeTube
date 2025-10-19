// This is injected into the sigFrame iframe
// See index.ejs and webpack.renderer.config.js
window.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)

  try {
    window.parent.postMessage(JSON.stringify({
      id: data.id,
      // eslint-disable-next-line no-new-func
      result: new Function(data.code)()
    }), '*')
  } catch (error) {
    window.parent.postMessage(JSON.stringify({
      id: data.id,
      error
    }), '*')
  }
})
