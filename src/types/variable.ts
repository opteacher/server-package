/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Model from './model'
import { BaseTypes } from './index'
import { gnlCpy } from '@/utils'

export default class Variable {
  key: string
  name: string
  vtype: BaseTypes | Model
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
    this.vtype = 'Unknown'
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
    this.vtype = 'Unknown'
    this.value = undefined
    this.prop = ''
    this.index = ''
    this.idxType = 'Unknown'
    this.default = undefined
    this.required = false
    this.remark = ''
  }

  static copy(src: any, tgt?: Variable, force = false): Variable {
    return gnlCpy(Variable, src, tgt, { force })
  }
}
