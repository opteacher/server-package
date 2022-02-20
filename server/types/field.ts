/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const mgnBtm = 24

export default class Field {
  key: string
  index: number
  label: string
  desc: string
  type: string // 表单组件类型
  rules: any[]

  constructor() {
    this.key = ''
    this.index = -1
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
  }

  reset() {
    this.key = ''
    this.index = -1
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
  }

  static copy(src: any, tgt?: Field): Field {
    tgt = tgt || new Field()
    tgt.key = src.key || tgt.key
    tgt.index = src.index || tgt.index
    tgt.label = src.label || tgt.label
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    tgt.rules = src.rules || tgt.rules
    return tgt
  }
}
