/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const mgnBtm = 24

export default class Field {
  key: string
  label: string
  desc: string
  type: string // 表单组件类型
  rules: any[]
  refer: string
  extra: any

  constructor() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.refer = ''
    this.extra = {}
  }

  reset() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.refer = ''
    this.extra = {}
  }

  static copy(src: any, tgt?: Field): Field {
    tgt = tgt || new Field()
    tgt.key = src.key || src._id || tgt.key
    tgt.label = src.label || tgt.label
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    tgt.rules = src.rules || tgt.rules
    tgt.refer = src.refer || tgt.refer
    tgt.extra = src.extra || tgt.extra
    return tgt
  }
}
