export default class Cell {
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

  static copy(src, tgt) {
    tgt = tgt || new Cell()
    tgt.key = src.key || src.id || src._id || tgt.key
    tgt.color = src.color || tgt.color
    tgt.prefix = src.prefix || tgt.prefix
    tgt.suffix = src.suffix || tgt.suffix
    return tgt
  }
}
