import { contextBridge } from 'electron/renderer'
import api from './interface.js'

contextBridge.exposeInMainWorld('ftElectron', api)
