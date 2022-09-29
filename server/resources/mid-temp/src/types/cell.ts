/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Cell {
  color: string
  prefix: string
  suffix: string
  ctype: string
  format: any
  refer: string

  constructor() {
    this.color = '#000000'
    this.prefix = ''
    this.suffix = ''
    this.ctype = ''
    this.format = null
    this.refer = ''
  }

  reset() {
    this.color = '#000000'
    this.prefix = ''
    this.suffix = ''
    this.ctype = ''
    this.format = null
    this.refer = ''
  }

  static copy(src: any, tgt?: Cell, force = false): Cell {
    tgt = tgt || new Cell()
    tgt.color = force ? src.color : src.color || tgt.color
    tgt.prefix = force ? src.prefix : src.prefix || tgt.prefix
    tgt.suffix = force ? src.suffix : src.suffix || tgt.suffix
    tgt.ctype = force ? src.ctype : src.ctype || tgt.ctype
    tgt.format = force ? src.format : src.format || tgt.format
    tgt.refer = force ? src.refer : src.refer || tgt.refer
    return tgt
  }
}
