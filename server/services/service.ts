/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Service from '../models/service.js'
import Project from '../models/project.js'
import axios from 'axios'

const RangeRegexp = /(Y|M|D|h|m|s|ms)$/
const TimeRegexp = /^(--|\d\d)\/(--|\d\d)\/(--|\d\d)T(--|\d\d):(--|\d\d):(--|\d\d)$/

export async function restart(pid: string, jid: string) {
  const pjt = await db.select(Project, { _index: pid })
  const host = process.env.ENV === 'prod' ? pjt.name : '127.0.0.1'
  const baseURL = `http://${host}:${pjt.port}/${pjt.name}`
  const svc = await db.select(Service, { _index: jid })
  if (svc.jobId) {
    await axios.delete(`${baseURL}${svc.path}/${svc.jobId}`)
  }
  let timestamp = 0
  if (RangeRegexp.test(svc.emitCond)) {
    // 以Y/M/D/h/m/s/ms结尾，则表示时间段
    // 对于time，则在此时间段后激发；对于interval，则每过此时间段就执行一次。
    switch (svc.emitCond.slice(-1)) {
      case 'Y':
        timestamp = parseInt(svc.emitCond.slice(0, -1)) * 365 * 24 * 60 * 60 * 1000
        break
      case 'M':
        timestamp = parseInt(svc.emitCond.slice(0, -1)) * 30 * 24 * 60 * 60 * 1000
        break
      case 'W':
        timestamp = parseInt(svc.emitCond.slice(0, -1)) * 7 * 24 * 60 * 60 * 1000
        break
      case 'D':
        timestamp = parseInt(svc.emitCond.slice(0, -1)) * 24 * 60 * 60 * 1000
        break
      case 'h':
        timestamp = parseInt(svc.emitCond.slice(0, -1)) * 60 * 60 * 1000
        break
      case 'm':
        timestamp = parseInt(svc.emitCond.slice(0, -1)) * 60 * 1000
        break
      case 's':
        if (svc.emitCond.endsWith('ms')) {
          timestamp = parseInt(svc.emitCond.slice(0, -2))
        } else {
          timestamp = parseInt(svc.emitCond.slice(0, -1)) * 1000
        }
        break
    }
  } else if (TimeRegexp.test(svc.emitCond)) {
    // 除此以外，如果是--/--/00T00:00:00格式存储，则在该时间点执行，激发方式随意
    const now = new Date()
    const result = TimeRegexp.exec(svc.emitCond)
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
  const resp = await axios.post(baseURL + svc.path, undefined, { params: { timestamp } })
  if (resp.status !== 200) {
    return { error: `启动任务错误：${resp.statusText}` }
  }
  return db.save(Service, { jobId: resp.data.result }, { _index: jid })
}

export async function stop(pid: string, jid: string) {
  const pjt = await db.select(Project, { _index: pid })
  const host = process.env.ENV === 'prod' ? pjt.name : '127.0.0.1'
  const baseURL = `http://${host}:${pjt.port}/${pjt.name}`
  const svc = await db.select(Service, { _index: jid })
  if (!svc.jobId) {
    return { error: '指定任务没有在运行' }
  }
  await axios.delete(`${baseURL}${svc.path}/${svc.jobId}`)
  return db.save(Service, { jobId: 0 }, { _index: jid })
}
