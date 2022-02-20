/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Field from './field.js'

export default class Property {
  key: string
  name: string
  label: string
  type: string // 字段类型
  index: boolean
  unique: boolean
  visible: boolean
  remark: string
  field: Field | null

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
    this.field = null
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
    this.field = null
  }

  static copy(src: any, tgt?: Property): Property {
    tgt = tgt || new Property()
    if (typeof src === 'string') {
      tgt.key = src
      return tgt
    }
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.label = src.label || tgt.label
    tgt.type = src.type || tgt.type
    tgt.index = src.index || tgt.index
    tgt.unique = src.unique || tgt.unique
    tgt.visible = src.visible || tgt.visible
    tgt.remark = src.remark || tgt.remark
    if (src.field) {
      tgt.field = Field.copy(src.field)
    }
    return tgt
  }
}
