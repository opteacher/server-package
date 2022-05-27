/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Dep {
  key: string
  name: string
  exports: string[]
  from: string
  default: boolean

  constructor() {
    this.key = ''
    this.name = ''
    this.exports = []
    this.from = ''
    this.default = true
  }

  static copy(src: any, tgt?: Dep): Dep {
    tgt = tgt || new Dep()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.exports = src.exports || tgt.exports
    tgt.from = src.from || tgt.from
    tgt.default = typeof src.default !== 'undefined' ? src.default : tgt.default
    return tgt
  }
}
