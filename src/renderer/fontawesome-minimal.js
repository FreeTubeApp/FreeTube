// https://docs.fontawesome.com/apis/javascript/plugins
// As FontAwesome doesn't provide types for the plugins entrypoint the types are manually applied to each export

import { register, Layers, ReplaceElements } from '@fortawesome/fontawesome-svg-core/plugins'

// the `icon` function is inside the ReplaceElements plugin
const api = register([Layers, ReplaceElements])

/** @type {import('@fortawesome/fontawesome-svg-core').Library} */
export const library = api.library

// used by the FontAwesomeIcon component

/** @type {import('@fortawesome/fontawesome-svg-core')['parse']} */
export const parse = api.parse
/** @type {import('@fortawesome/fontawesome-svg-core')['icon']} */
export const icon = api.icon

// used by the FontAwesomeLayers component
/** @type {import('@fortawesome/fontawesome-svg-core')['config']} */
export const config = api.config

// used by the FontAwesomeLayersText component, which we don't use but we have to specify this here
// to make webpack happy (imports are processed before unused code is removed)
export const text = () => { }
