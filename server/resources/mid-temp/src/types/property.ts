/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseTypes } from '.'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Property {
  key: string
  name: string
  label: string
  ptype: BaseTypes // 字段类型
  index: boolean
  unique: boolean
  visible: boolean
  remark: string

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.ptype = 'Unknown'
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.ptype = 'Unknown'
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
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
    tgt.ptype = src.ptype || tgt.ptype
    tgt.index = src.index || tgt.index
    tgt.unique = src.unique || tgt.unique
    tgt.visible = src.visible || tgt.visible
    tgt.remark = src.remark || tgt.remark
    return tgt
  }
}
