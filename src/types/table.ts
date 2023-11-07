/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Cell from './cell'
import Column from '@lib/types/column'

export class Cells extends Cell {
  selCond: string
  cdCell: Record<string, Cell>

  constructor() {
    super()
    this.selCond = ''
    this.cdCell = {}
  }

  reset() {
    super.reset()
    this.selCond = ''
    this.cdCell = {}
  }

  static copy(src: any, tgt?: Cells, force = false): Cells {
    tgt = tgt || new Cells()
    Cell.copy(src, tgt, force)
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
  maxPerPgs: number
  demoData: any
  columns: Column[]
  cells: Cells[]
  operable: string[]
  refresh: string[]
  expandURL: string
  expHeight: number
  colDspable: boolean
  imExport: string[]

  constructor() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.maxPerPgs = 10
    this.demoData = null
    this.columns = []
    this.cells = []
    this.operable = []
    this.refresh = []
    this.expandURL = ''
    this.expHeight = -1
    this.colDspable = false
    this.imExport = []
  }

  reset() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.maxPerPgs = 10
    this.demoData = null
    this.columns = []
    this.cells = []
    this.operable = []
    this.refresh = []
    this.expandURL = ''
    this.expHeight = -1
    this.colDspable = false
    this.imExport = []
  }

  static copy(src: any, tgt?: Table, force = false): Table {
    tgt = tgt || new Table()
    tgt.key = src.key || src._id || tgt.key
    tgt.title = force ? src.title : src.title || tgt.title
    tgt.desc = force ? src.desc : src.desc || tgt.desc
    tgt.operaStyle = force ? src.operaStyle : src.operaStyle || tgt.operaStyle
    tgt.size = force ? src.size : src.size || tgt.size
    tgt.hasPages = typeof src.hasPages !== 'undefined' ? src.hasPages : force ? false : tgt.hasPages
    tgt.maxPerPgs = force ? src.maxPerPgs : src.maxPerPgs || tgt.maxPerPgs
    tgt.demoData = src.demoData
    tgt.columns = src.columns ? src.columns.map((col: any) => Column.copy(col)) : []
    tgt.cells = (src.cells || []).map((cell: any) => Cells.copy(cell))
    tgt.operable = force ? src.operable : src.operable || tgt.operable
    tgt.refresh = force ? src.refresh : src.refresh || tgt.refresh
    tgt.expandURL = force ? src.expandURL : src.expandURL || tgt.expandURL
    tgt.expHeight = force ? src.expHeight : src.expHeight || tgt.expHeight
    tgt.colDspable = force
      ? src.colDspable
      : typeof src.colDspable !== 'undefined'
      ? src.colDspable
      : tgt.colDspable
    tgt.imExport = force ? src.imExport || [] : src.imExport || tgt.imExport
    return tgt
  }
}
