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

export const timeUnits = [
  {
    label: '毫秒',
    value: 'ms'
  },
  {
    label: '秒',
    value: 's'
  },
  {
    label: '分钟',
    value: 'm'
  },
  {
    label: '小时',
    value: 'h'
  },
  {
    label: '天',
    value: 'D'
  },
  {
    label: '周',
    value: 'W'
  },
  {
    label: '月',
    value: 'M'
  },
  {
    label: '年',
    value: 'Y'
  }
]

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

export type Method = 'GET' | 'POST' | 'DELETE' | 'PUT'

export default class Service {
  key: string
  name: string
  interface: string
  emit: EmitType
  flow: Node | null
  isModel: boolean
  method: Method
  path: string | undefined
  jobId: number
  condition: string
  cdValue: number
  cdUnit: string
  needRet: boolean

  constructor() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.isModel = false
    this.method = 'GET'
    this.path = undefined
    this.jobId = 0
    this.condition = ''
    this.cdValue = 1
    this.cdUnit = 's'
    this.needRet = true
  }

  reset() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.isModel = false
    this.method = 'GET'
    this.path = undefined
    this.jobId = 0
    this.condition = ''
    this.cdValue = 1
    this.cdUnit = 's'
    this.needRet = true
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
    return tgt
  }
}
