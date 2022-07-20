/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Cell from './cell'
import Column from './column'
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
    this.cells = {}
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
    this.cells = {}
    this.operable = []
    this.refresh = []
  }

  static copy(src: any, tgt?: Table, force = false): Table {
    tgt = tgt || new Table()
    tgt.key = src.key || src._id || tgt.key
    tgt.title = force ? src.title : (src.title || tgt.title)
    tgt.desc = force ? src.desc : (src.desc || tgt.desc)
    tgt.operaStyle = force ? src.operaStyle : (src.operaStyle || tgt.operaStyle)
    tgt.size = force ? src.size : (src.size || tgt.size)
    tgt.hasPages = typeof src.hasPages !== 'undefined' ? src.hasPages : (force ? false : tgt.hasPages)
    tgt.demoData = src.demoData
    tgt.columns = src.columns ? src.columns.map((col: any) => Column.copy(col)) : []
    tgt.cells = Object.fromEntries(
      Object.entries(src.cells || {}).map(([key, cell]: [string, any]) => [key, Cell.copy(cell)])
    )
    tgt.operable = force ? src.operable : (src.operable || tgt.operable)
    tgt.refresh = force ? src.refresh : (src.refresh || tgt.refresh)
    return tgt
  }
}
