/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import Node from './node'

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

export type Method = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'LINK'

export default class Service {
  key: string
  name: string
  interface: string
  emit: EmitType
  flow: Node | null
  model: string
  method: Method
  path: string | undefined
  jobId: number
  condition: string
  cdValue: number
  cdUnit: string
  needRet: boolean
  desc: string

  constructor() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.model = ''
    this.method = 'GET'
    this.path = undefined
    this.jobId = 0
    this.condition = ''
    this.cdValue = 1
    this.cdUnit = 's'
    this.needRet = true
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
    this.path = undefined
    this.jobId = 0
    this.condition = ''
    this.cdValue = 1
    this.cdUnit = 's'
    this.needRet = true
    this.desc = ''
  }

  static copy(src: any, tgt?: Service): Service {
    tgt = tgt || new Service()
    tgt.key = src.key || src._id || tgt.key
    if (src.service && src.service.length === 2) {
      tgt.name = src.service[0]
      tgt.interface = src.service[1]
    } else {
      tgt.name = src.name || tgt.name
      tgt.interface = src.interface || tgt.interface
    }
    tgt.emit = src.emit || tgt.emit
    if (src.flow) {
      tgt.flow = Node.copy(src.flow)
    } else {
      tgt.flow = null
    }
    tgt.model = src.model || tgt.model
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.jobId = src.jobId || tgt.jobId
    tgt.condition = src.condition || tgt.condition
    const emtNum = /^\d+/.exec(tgt.condition)
    tgt.cdValue =
      src.cdValue || (tgt.condition && emtNum && emtNum.length ? emtNum[0] : tgt.cdValue)
    const emtUnt = /(Y|M|W|D|h|m|s|ms)$/.exec(tgt.condition)
    tgt.cdUnit = src.cdUnit || (tgt.condition && emtUnt && emtUnt.length ? emtUnt[0] : tgt.cdUnit)
    tgt.needRet = typeof src.needRet !== 'undefined' ? src.needRet : tgt.needRet
    tgt.desc = src.desc || tgt.desc
    return tgt
  }
}
