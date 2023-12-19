import { gnlCpy } from '@/utils'

import Node from './node'
import Property from './property'

export class Func {
  key: string
  name: string
  args: Property[]
  isAsync: boolean
  remark: string
  flow: Node | string

  constructor() {
    this.key = ''
    this.name = ''
    this.args = []
    this.isAsync = false
    this.remark = ''
    this.flow = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.args = []
    this.isAsync = false
    this.remark = ''
    this.flow = ''
  }

  static copy(src: any, tgt?: Func, force = false): Func {
    tgt = gnlCpy(Func, src, tgt, { force, cpyMapper: { args: Property.copy }, ignProps: ['flow'] })
    if (src.flow) {
      if (typeof src.flow === 'string') {
        tgt.flow = src.flow
      } else {
        Node.copy(src.flow, tgt.flow as Node, force)
      }
    } else if (force) {
      tgt.flow = ''
    }
    return tgt
  }
}

export default class Typo {
  key: string
  name: string
  label: string
  desc: string
  props: Property[]
  funcs: Func[]

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.desc = ''
    this.props = []
    this.funcs = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.desc = ''
    this.props = []
    this.funcs = []
  }

  static copy(src: any, tgt?: Typo, force = false): Typo {
    return gnlCpy(Typo, src, tgt, { force, cpyMapper: { props: Property.copy, funcs: Func.copy } })
  }
}
