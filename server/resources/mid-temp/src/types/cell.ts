/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { v4 as uuidv4 } from 'uuid'

export default class Cell {
  color: string
  prefix: string
  suffix: string

  constructor() {
    this.color = '#000000'
    this.prefix = ''
    this.suffix = ''
  }

  reset() {
    this.color = '#000000'
    this.prefix = ''
    this.suffix = ''
  }

  static copy(src: any, tgt?: Cell, force = false): Cell {
    tgt = tgt || new Cell()
    tgt.color = force ? src.color : src.color || tgt.color
    tgt.prefix = force ? src.prefix : src.prefix || tgt.prefix
    tgt.suffix = force ? src.suffix : src.suffix || tgt.suffix
    return tgt
  }
}
