import { fork } from 'child_process'

let firstRun = true
let childPcs: any = null

export function start (callback?: (value: unknown) => void) {
  childPcs = fork('./app.js', {
    silent: false
  }).on('spawn', () => {
    callback && callback('服务已部署')
  }).on('exit', () => {
    start(callback)
  }).on('message', (message: any) => {
    if (message === 'restart') {
      console.log('服务将在5秒后重启！')
      setTimeout(restart, 5000)
    }
  })
}

export function restart (callback?: (value: unknown) => void) {
  if (childPcs) {
    process.kill(childPcs.pid || 0, 'SIGTERM')
  } else {
    start(callback)
  }
}

if (firstRun) {
  firstRun = false
  start()
}
