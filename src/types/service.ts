/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Node from './node'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type EmitType = 'api' | 'timeout' | 'interval' | 'none'

export const emitTypeOpns = [
  {
    label: '网络接口',
    value: 'api'
  },
  {
    label: '延时',
    value: 'timeout'
  },
  {
    label: '定时',
    value: 'interval'
  },
  {
    label: '无',
    value: 'none'
  }
]

export default class Service {
  key: string
  name: string
  interface: string
  emit: EmitType
  flow: Node | null
  isModel: boolean
  model: string
  method: string
  path: string | undefined
  jobId: number
  emitCond: string
  cdValue: number
  cdUnit: string

  constructor() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.isModel = false
    this.model = ''
    this.method = ''
    this.path = undefined
    this.jobId = 0
    this.emitCond = ''
    this.cdValue = 1
    this.cdUnit = 's'
  }

  reset() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.isModel = false
    this.model = ''
    this.method = ''
    this.path = undefined
    this.jobId = 0
    this.emitCond = ''
    this.cdValue = 1
    this.cdUnit = 's'
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
    tgt.isModel = src.isModel || tgt.isModel
    tgt.model = src.model || tgt.model
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.jobId = src.jobId || tgt.jobId
    tgt.emitCond = src.emitCond || tgt.emitCond
    const emtNum = /^\d+/.exec(tgt.emitCond)
    tgt.cdValue = src.cdValue || (tgt.emitCond && emtNum && emtNum.length ? emtNum[0] : tgt.cdValue)
    const emtUnt = /(Y|M|W|D|h|m|s|ms)$/.exec(tgt.emitCond)
    tgt.cdUnit = src.cdUnit || (tgt.emitCond && emtUnt && emtUnt.length ? emtUnt[0] : tgt.cdUnit)
    return tgt
  }
}
