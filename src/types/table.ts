/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Cell from './cell'
import Column from './column'

export class Cells extends Cell {
  refer: string
  selCond: string
  cdCell: Record<string, Cell>

  constructor() {
    super()
    this.refer = ''
    this.selCond = ''
    this.cdCell = {}
  }

  reset() {
    super.reset()
    this.refer = ''
    this.selCond = ''
    this.cdCell = {}
  }

  static copy(src: any, tgt?: Cells, force = false): Cells {
    tgt = tgt || new Cells()
    Cell.copy(src, tgt, force)
    tgt.refer = force ? src.refer : src.refer || tgt.refer
    tgt.selCond = force ? src.selCond : src.selCond || tgt.selCond
    tgt.cdCell = src.cdCell
      ? Object.fromEntries(
          Object.entries(src.cdCell).map(([cond, data]: [string, any]) => [cond, Cell.copy(data)])
        )
      : force
      ? {}
      : tgt.cdCell
    return tgt
  }
}
export default class Table {
  key: string
  title: string
  desc: string
  operaStyle: 'button' | 'link'
  size: 'small' | 'default' | 'middle'
  hasPages: boolean
  demoData: any
  columns: Column[]
  cells: Cells[]
  operable: string[]
  refresh: string[]

  constructor() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.demoData = null
    this.columns = []
    this.cells = []
    this.operable = []
    this.refresh = []
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
    this.cells = []
    this.operable = []
    this.refresh = []
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
    tgt.cells = (src.cells || []).map((cell: any) => Cells.copy(cell))
    tgt.operable = src.operable || tgt.operable
    tgt.refresh = src.refresh || tgt.refresh
    return tgt
  }
}
