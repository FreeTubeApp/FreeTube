const config = require('./webpack.botGuardScript.config.js')
const { join } = require('path')

config.output.path = join(__dirname, '../android/app/src/main/assets/')

module.exports = config
