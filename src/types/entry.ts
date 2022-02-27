/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { v4 as uuidv4 } from 'uuid'

export default class Entry {
  key: string
  color: string
  prefix: string
  suffix: string

  constructor() {
    this.key = ''
    this.color = '#000000'
    this.prefix = ''
    this.suffix = ''
  }

  reset() {
    this.key = ''
    this.color = '#000000'
    this.prefix = ''
    this.suffix = ''
  }

  static copy(src: any, tgt?: Entry): Entry {
    tgt = tgt || new Entry()
    tgt.key = src.key || uuidv4()
    tgt.color = src.color || tgt.color
    tgt.prefix = src.prefix || tgt.prefix
    tgt.suffix = src.suffix || tgt.suffix
    return tgt
  }
}
