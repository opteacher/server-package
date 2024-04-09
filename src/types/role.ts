/* eslint-disable @typescript-eslint/no-explicit-any */

import { gnlCpy } from '@/utils'
import Rule from './rule'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Role {
  key: string
  name: string
  extend: string
  rules: Rule[]

  constructor() {
    this.key = ''
    this.name = ''
    this.extend = ''
    this.rules = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.extend = ''
    this.rules = []
  }

  static copy(src: any, tgt?: Role, force = false): Role {
    return gnlCpy(Role, src, tgt, { force, cpyMapper: { rules: Rule.copy } })
  }
}
