const ProxyChain = require('proxy-chain')

process.parentPort.once('message', async (event) => {
  const { protocol, hostname, port, username, password } = event.data
  const upstreamUrl = `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hostname}:${port}`

  const server = new ProxyChain.Server({
    port: 0,
    verbose: false,
    prepareRequestFunction: () => ({ upstreamProxyUrl: upstreamUrl }),
  })

  await server.listen()
  process.parentPort.postMessage(server.port)
})
