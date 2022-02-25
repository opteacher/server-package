/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Column {
  title: string
  dataIndex: string
  key: string
  width?: number
  slots: {
    title?: string
    customRender: string
  }
  align: 'left' | 'right' | 'center'
  sorter: boolean

  constructor(
    title: string,
    dataIdx: string,
    options?: {
      width?: number
      slotTitle?: string
      align?: 'left' | 'right' | 'center'
      sortable?: boolean
      searchable?: boolean
      filterable?: boolean
    }
  ) {
    this.title = title
    this.dataIndex = dataIdx
    this.key = dataIdx
    this.slots = { customRender: dataIdx }
    if (options && options.slotTitle) {
      this.slots.title = options.slotTitle
    }
    if (options && options.width) {
      this.width = options.width
    }
    this.align = options && options.align ? options.align : 'left'
    this.sorter = options && typeof options.sortable !== 'undefined' ? options.sortable : false
  }

  static copy(src: any, tgt?: Column): Column {
    tgt = tgt || new Column('', '')
    tgt.title = src.title || tgt.title
    tgt.dataIndex = src.dataIndex || tgt.dataIndex
    if (src.slots && src.slots.customRender) {
      tgt.slots.customRender = src.slots.customRender
    }
    if (src.slots && src.slots.title) {
      tgt.slots.title = src.slots.title
    }
    tgt.width = src.width || tgt.width
    tgt.align = src.align || tgt.align
    tgt.sorter =
      typeof src.sorter !== 'undefined'
        ? src.sorter
        : typeof src.sortable !== 'undefined'
        ? src.sortable
        : false
    return tgt
  }
}
