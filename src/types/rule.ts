/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const authValues = ['/', 's', '*', '*/*']
export default class Rule {
  key: string
  method: string
  path: string
  value: string
  action: string

  constructor() {
    this.key = ''
    this.method = 'GET'
    this.path = ''
    this.value = '*/*'
    this.action = ''
  }

  reset() {
    this.key = ''
    this.method = 'GET'
    this.path = ''
    this.value = '*/*'
    this.action = ''
  }

  static copy(src: any, tgt?: Rule): Rule {
    tgt = tgt || new Rule()
    tgt.key = src.key || src._id || tgt.key
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.value = src.value || tgt.value
    tgt.action = src.action || tgt.action
    return tgt
  }
}
