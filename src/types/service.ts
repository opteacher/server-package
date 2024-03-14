/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs, { Dayjs } from 'dayjs'

import { gnlCpy } from '../utils'
import Node from './node'
import Variable from './variable'

export const emitMapper = {
  api: '网络接口',
  timeout: '延时',
  interval: '定时',
  app_start: '服务开始',
  app_stop: '服务停止',
  none: '无'
}

export type EmitType = keyof typeof emitMapper

export const emitTypeOpns = Object.entries(emitMapper).map(([value, label]) => ({ label, value }))

export const tmUntMapper = {
  ms: '毫秒',
  s: '秒',
  m: '分钟',
  H: '小时',
  D: '天',
  W: '周',
  M: '月',
  Y: '年'
} as Record<string, string>

export const timeUnits = Object.entries(tmUntMapper).map(([value, label]) => ({ label, value }))

export const itvlDimenMapper = {
  seconds: '秒',
  minutes: '分钟',
  hours: '小时',
  days: '天',
  weeks: '周',
  months: '月'
}

export type ItvlDimen = keyof typeof itvlDimenMapper

export const itvlDimen = Object.entries(itvlDimenMapper).map(([value, label]) => ({ label, value }))

export const weekDayMapper = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日'
}

export const weekDays = Object.entries(weekDayMapper).map(([value, label]) => ({
  label,
  value: parseInt(value)
}))

export const methods: Method[] = ['GET', 'POST', 'DELETE', 'PUT', 'LINK']

export type Method = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'LINK'

export const mthdClrs: Record<Method, string> = {
  POST: 'orange',
  DELETE: 'red',
  PUT: 'cyan',
  GET: 'green',
  LINK: 'purple'
}

export default class Service {
  key: string
  name: string
  interface: string
  emit: EmitType
  flow: Node | null
  model: string
  method: Method
  path: string
  jobId: string
  condition: string
  interval: {
    value: number
    dimen: ItvlDimen
    rightnow: boolean
  }
  datetime: Dayjs
  needRet: boolean
  stcVars: Variable[]
  desc: string

  constructor() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.model = ''
    this.method = 'GET'
    this.path = ''
    this.jobId = ''
    this.condition = ''
    this.interval = {
      value: 1,
      dimen: 'seconds',
      rightnow: true
    }
    this.datetime = dayjs(null)
    this.needRet = true
    this.stcVars = []
    this.desc = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.model = ''
    this.method = 'GET'
    this.path = ''
    this.jobId = ''
    this.condition = ''
    this.interval = {
      value: 1,
      dimen: 'seconds',
      rightnow: true
    }
    this.datetime = dayjs(null)
    this.needRet = true
    this.stcVars = []
    this.desc = ''
  }

  static copy(src: any, tgt?: Service, force = false): Service {
    tgt = gnlCpy(Service, src, tgt, {
      force,
      ignProps: ['name', 'interface', 'interval', 'datetime'],
      cpyMapper: { flow: Node.copy, stcVars: Variable.copy }
    })
    if (src.service && src.service.length === 2) {
      tgt.name = src.service[0]
      tgt.interface = src.service[1]
    } else {
      tgt.name = src.name || tgt.name
      tgt.interface = src.interface || tgt.interface
    }
    if (src.condition) {
      if (src.condition.split(' ').length === 2) {
        [tgt.interval.value, tgt.interval.dimen] = src.condition.split(' ')
      } else if (src.condition.includes('/') && src.condition.includes(':')) {
        tgt.datetime = dayjs(src.condition, 'YYYY/MM/DDTHH:mm:ss')
      }
      tgt.interval.rightnow = true
    } else if (force) {
      tgt.interval.value = 1
      tgt.interval.dimen = 'seconds'
      tgt.interval.rightnow = true
    }
    return tgt
  }
}
