const exec = require('child_process').exec

/**
 * Calls `child_process`.exec, but it outputs
 * all of the stdout live and can be awaited
 * @param {string} command The command to be executed
 * @returns
 */
function execWithLiveOutput (command) {
  return new Promise((resolve, reject) => {
    const execCall = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      resolve()
    })
    execCall.stdout.on('data', (data) => {
      process.stdout.write(data)
    })
    execCall.stderr.on('data', (data) => {
      console.error(data)
    })
    execCall.on('close', () => {
      resolve()
    })
  })
}

module.exports = {
  execWithLiveOutput
}
