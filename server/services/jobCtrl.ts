import Router from 'koa-router'
import { db } from '@/utils/index.js'
import Service from '../models/service.js'

const router = new Router()

router.post('/server-package/job/v1/time/:jid', ctx => {
  ctx.body = {
    result: ''
  }
})

router.put('/server-package/job/v1/time/:jid', ctx => {
  ctx.body = {
    result: ''
  }
})

router.get('/server-package/job/v1/time/:jid', ctx => {
  ctx.body = {
    result: ''
  }
})

const RangeRegexp = /(Y|M|D|h|m|s|ms)$/
const TimeRegexp = /^(--|\d\d)\/(--|\d\d)\/(--|\d\d)T(--|\d\d):(--|\d\d):(--|\d\d)$/
const startMapper: {
  [emit: string]: (callback: () => void, ms: number) => NodeJS.Timer
} = {
  'timeout': setTimeout,
  'interval': setInterval
}
const stopMapper: {
  [emit: string]: (tmot: NodeJS.Timer) => void
} = {
  'timeout': clearTimeout,
  'interval': clearInterval
}

export async function restart(jid: string) {
  const api = await db.select(Service, { _index: jid })
  if (api.jobId) {
    stopMapper[api.emit](api.jobId)
  }
  const module = await import(`../${api.name}.js`)
  let timestamp = 0
  if (RangeRegexp.test(api.emitCond)) {
    // 以Y/M/D/h/m/s/ms结尾，则表示时间段
    // 对于time，则在此时间段后激发；对于interval，则每过此时间段就执行一次。
    switch (api.emitCond.slice(-1)) {
      case 'Y':
        timestamp = parseInt(api.emitCond.slice(0, -1)) * 365 * 24 * 60 * 60 * 1000
        break
      case 'M':
        timestamp = parseInt(api.emitCond.slice(0, -1)) * 30 * 24 * 60 * 60 * 1000
        break
      case 'D':
        timestamp = parseInt(api.emitCond.slice(0, -1)) * 24 * 60 * 60 * 1000
        break
      case 'h':
        timestamp = parseInt(api.emitCond.slice(0, -1)) * 60 * 60 * 1000
        break
      case 'm':
        timestamp = parseInt(api.emitCond.slice(0, -1)) * 60 * 1000
        break
      case 's':
        if (api.emitCond.endsWith('ms')) {
          timestamp = parseInt(api.emitCond.slice(0, -2))
        } else {
          timestamp = parseInt(api.emitCond.slice(0, -1)) * 1000
        }
        break
    }
  } else if (TimeRegexp.test(api.emitCond)) {
    // 除此以外，如果是--/--/00T00:00:00格式存储，则在该时间点执行，激发方式随意
    const now = new Date()
    const result = TimeRegexp.exec(api.emitCond)
    if (!result || result.length < 7) {
      return { error: '错误的时间点格式' }
    }
    const datetime = new Date(
      result[1] === '--' ? now.getFullYear() : parseInt(result[1] + 2000),
      result[2] === '--' ? now.getMonth() : parseInt(result[2]),
      result[3] === '--' ? now.getDay() : parseInt(result[3]),
      result[4] === '--' ? now.getHours() : parseInt(result[4]),
      result[5] === '--' ? now.getMinutes() : parseInt(result[5]),
      result[6] === '--' ? now.getSeconds() : parseInt(result[6])
    )
    timestamp = datetime.getTime() - now.getTime()
  }
  if (!timestamp) {
    return { error: '错误的时间条件' }
  }
  switch (api.emit) {
    case 'time':
      api.jobId = setTimeout(module[api.interface], timestamp)
      break
    case 'interval':
      api.jobId = setInterval(module[api.interface], timestamp)
      break
  }
  return db.save(Service, { jobId: api.jobId }, { _index: jid })
}

export async function stop(jid: string) {
  const api = await db.select(Service, { _index: jid })
  if (!api.jobId) {
    return { error: '指定任务没有在运行' }
  }
  switch (api.emit) {
    case 'time':
      clearTimeout(api.jobId)
      break
    case 'interval':
      setInterval(api.jobId)
      break
  }
  return db.save(Service, { jobId: 0 }, { _index: jid })
}

export default router
