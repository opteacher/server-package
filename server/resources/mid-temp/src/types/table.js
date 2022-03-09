'use strict'
import Cell from './cell'
import Column from './column'

export default class Table {
  constructor() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.columns = []
    this.cells = {}
    this.operable = []
  }

  static copy(src, tgt) {
    tgt = tgt || new Table()
    tgt.key = src.key || src.id || src._id || tgt.key
    tgt.title = src.title || tgt.title
    tgt.desc = src.desc || tgt.desc
    tgt.operaStyle = src.operaStyle || tgt.operaStyle
    tgt.size = src.size || tgt.size
    tgt.hasPages = typeof src.hasPages !== 'undefined' ? src.hasPages : tgt.hasPages
    tgt.columns = src.columns ? src.columns.map(col => Column.copy(col)) : []
    tgt.cells = Object.fromEntries(
      Object.entries(src.cells || {}).map(([key, cell]) => [key, Cell.copy(cell)])
    )
    tgt.operable = src.operable || tgt.operable
    return tgt
  }
}
