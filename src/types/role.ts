/* eslint-disable @typescript-eslint/no-explicit-any */

import Rule from './rule'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Role {
  key: string
  name: string
  rules: Rule[]

  constructor() {
    this.key = ''
    this.name = ''
    this.rules = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.rules = []
  }

  static copy(src: any, tgt?: Role): Role {
    tgt = tgt || new Role()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    if (src.rules) {
      tgt.rules.splice(0, tgt.rules.length)
      tgt.rules.push(
        ...src.rules.map((rule: any) => {
          return Rule.copy(typeof rule === 'string' ? { key: rule } : rule)
        })
      )
    }
    return tgt
  }
}
