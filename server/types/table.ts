/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Cell from './cell.js'
import Column from './column.js'
export default class Table {
  key: string
  title: string
  desc: string
  operaStyle: 'button' | 'link'
  size: 'small' | 'default' | 'middle'
  hasPages: boolean
  demoData: any
  columns: Column[]
  cells: Record<string, Cell>
  operable: string[]

  constructor() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.demoData = null
    this.columns = []
    this.cells = {}
    this.operable = []
  }

  reset() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.demoData = null
    this.columns = []
    this.cells = {}
    this.operable = []
  }

  static copy(src: any, tgt?: Table): Table {
    tgt = tgt || new Table()
    tgt.key = src.key || src._id || tgt.key
    tgt.title = src.title || tgt.title
    tgt.desc = src.desc || tgt.desc
    tgt.operaStyle = src.operaStyle || tgt.operaStyle
    tgt.size = src.size || tgt.size
    tgt.hasPages = typeof src.hasPages !== 'undefined' ? src.hasPages : tgt.hasPages
    tgt.demoData = src.demoData
    tgt.columns = src.columns ? src.columns.map((col: any) => Column.copy(col)) : []
    tgt.cells = Object.fromEntries(
      Object.entries(src.cells || {}).map(([key, cell]: [string, any]) => [key, Cell.copy(cell)])
    )
    tgt.operable = src.operable || tgt.operable
    return tgt
  }
}
