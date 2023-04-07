/* eslint-disable @typescript-eslint/no-explicit-any */

import { gnlCpy } from "@/utils"

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Dep {
  key: string
  name: string
  exports: string[]
  from: string
  default: boolean
  version: string

  constructor() {
    this.key = ''
    this.name = ''
    this.exports = []
    this.from = ''
    this.default = true
    this.version = ''
  }

  static copy(src: any, tgt?: Dep, force = false): Dep {
    return gnlCpy(Dep, src, tgt, { force })
  }
}
