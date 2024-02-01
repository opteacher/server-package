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
  h: '小时',
  D: '天',
  W: '周',
  M: '月',
  Y: '年'
} as Record<string, string>

export const timeUnits = Object.entries(tmUntMapper).map(([value, label]) => ({ label, value }))

export const itvlDimenMapper = {
  s: '秒',
  m: '分钟',
  h: '小时',
  D: '天',
  W: '周',
  M: '月',
}

export const itvlDimen = Object.entries(itvlDimenMapper).map(([value, label]) => ({ label, value }))

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
  condArray: [number, string]
  condDtTm: Dayjs
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
    this.condArray = [1, 's']
    this.condDtTm = dayjs(0)
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
    this.condArray = [1, 's']
    this.condDtTm = dayjs(0)
    this.needRet = true
    this.stcVars = []
    this.desc = ''
  }

  static copy(src: any, tgt?: Service, force = false): Service {
    tgt = gnlCpy(Service, src, tgt, {
      force,
      ignProps: ['name', 'interface', 'condArray', 'condDtTm'],
      cpyMapper: { flow: Node.copy, stcVars: Variable.copy }
    })
    if (src.service && src.service.length === 2) {
      tgt.name = src.service[0]
      tgt.interface = src.service[1]
    } else {
      tgt.name = src.name || tgt.name
      tgt.interface = src.interface || tgt.interface
    }
    tgt.condArray = src.condition ? src.condition.split(' ') : force ? [1, 's'] : tgt.condArray
    tgt.condDtTm = src.condition ? dayjs(src.condition) : force ? dayjs(0) : tgt.condDtTm
    return tgt
  }
}
