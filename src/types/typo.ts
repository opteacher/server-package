import { gnlCpy } from '@/utils'

import Node from './node'
import Variable from './variable'

export class Func {
  key: string
  name: string
  args: Variable[]
  flow: Node | string

  constructor() {
    this.key = ''
    this.name = ''
    this.args = []
    this.flow = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.args = []
    this.flow = ''
  }

  static copy(src: any, tgt?: Func, force = false): Func {
    tgt = gnlCpy(Func, src, tgt, { force, cpyMapper: { args: Variable.copy }, ignProps: ['flow'] })
    if (src.flow) {
      if (typeof src.flow === 'string') {
        tgt.flow = src.flow
      } else {
        Node.copy(src.flow, tgt.flow as Node, force)
      }
    } else if (force) {
      tgt.flow = ''
    }
    return
  }
}

export default class Typo {
  key: string
  name: string
  label: string
  desc: string
  props: Variable[]
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
    return gnlCpy(Typo, src, tgt, { force, cpyMapper: { props: Variable.copy, funcs: Func.copy } })
  }
}
