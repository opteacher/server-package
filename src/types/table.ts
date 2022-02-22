/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Table {
  key: string
  size: 'small' | 'default' | 'middle'

  constructor() {
    this.key = ''
    this.size = 'default'
  }

  reset() {
    this.key = ''
    this.size = 'default'
  }

  static copy(src: any, tgt?: Table): Table {
    tgt = tgt || new Table()
    tgt.key = src.key || src._id || tgt.key
    tgt.size = src.size || tgt.size
    return tgt
  }
}
