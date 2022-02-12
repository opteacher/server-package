/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Model from './model.js'
import { BaseTypes } from './index.js'

export default class Variable {
  key: string
  name: string
  type: BaseTypes | Model
  value: any
  prop: string
  index: string
  idxType: BaseTypes
  default: any
  required: boolean
  remark: string

  constructor() {
    this.key = ''
    this.name = ''
    this.type = 'Unknown'
    this.value = undefined
    this.prop = ''
    this.index = ''
    this.idxType = 'Unknown'
    this.default = undefined
    this.required = false
    this.remark = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.type = 'Unknown'
    this.value = undefined
    this.prop = ''
    this.index = ''
    this.idxType = 'Unknown'
    this.default = undefined
    this.required = false
    this.remark = ''
  }

  static copy(src: any, tgt?: Variable): Variable {
    tgt = tgt || new Variable()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.type = src.type || tgt.type
    tgt.value = src.value || tgt.value
    tgt.prop = src.prop || tgt.prop
    tgt.index = src.index || tgt.index
    tgt.idxType = src.idxType || tgt.idxType
    tgt.default = src.default || tgt.default
    tgt.required = src.required || tgt.required
    tgt.remark = src.remark || tgt.remark
    return tgt
  }
}
