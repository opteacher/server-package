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
  relative: {
    model: string
    belong: boolean
    isArray: boolean
  }
  remark: string
  default: any

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.ptype = 'Unknown'
    this.index = false
    this.unique = false
    this.visible = true
    this.relative = {
      model: '',
      belong: false,
      isArray: false
    }
    this.remark = ''
    this.default = undefined
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.ptype = 'Unknown'
    this.index = false
    this.unique = false
    this.visible = true
    this.relative.model = ''
    this.relative.belong = false
    this.relative.isArray = false
    this.remark = ''
    this.default = undefined
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
    if (src.relative) {
      tgt.relative.model = src.relative.model || tgt.relative.model
      tgt.relative.belong =
        typeof src.relative.belong !== 'undefined'
          ? JSON.parse(src.relative.belong)
          : tgt.relative.belong
      tgt.relative.isArray =
        typeof src.relative.isArray !== 'undefined'
          ? JSON.parse(src.relative.isArray)
          : tgt.relative.isArray
    }
    tgt.visible = src.visible || tgt.visible
    tgt.remark = src.remark || tgt.remark
    tgt.default = typeof src.default !== 'undefined' ? src.default : tgt.default
    return tgt
  }
}
