const Application = require('spectron').Application
const electronPath = require('electron')
const path = require('path')

describe('Application launch', () => {
  jest.setTimeout(30000)

  const app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '../../dist/main.js')]
  })

  beforeEach(async () => {
    await app.start()
  })

  afterAll(async () => {
    if (app && app.isRunning()) {
      await app.stop()
    }
  })

  it('shows an initial window', async () => {
    const count = await app.client.getWindowCount()
    expect(count).toBe(1)
  })
})
