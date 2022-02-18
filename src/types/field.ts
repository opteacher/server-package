/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class Field {
  key: string
  label: string
  desc: string
  type: string // 表单组件类型
  rules: any[]
  disabled: boolean
  display: boolean
  options:
    | string[]
    | {
        title: string
        subTitle?: string
        value: any
      }[]
  chkLabels: [string, string]

  constructor() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.disabled = false
    this.display = true
    this.options = []
    this.chkLabels = ['', '']
  }

  reset() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.disabled = false
    this.display = true
    this.options = []
    this.chkLabels = ['', '']
  }

  static copy(src: any, tgt?: Field): Field {
    tgt = tgt || new Field()
    tgt.key = src.key || tgt.key
    tgt.label = src.label || tgt.label
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    tgt.rules = src.rules || tgt.rules
    tgt.disabled = src.disabled || tgt.disabled
    tgt.display = src.display || tgt.display
    tgt.options = src.options || tgt.options
    tgt.chkLabels = src.chkLabels || tgt.chkLabels
    return tgt
  }
}
