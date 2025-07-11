import api from './interface.js'

declare global {
  interface Window {
    ftElectron: typeof api
  }
}
