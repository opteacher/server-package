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

  constructor(
    title: string,
    dataIdx: string,
    options?: {
      key?: string
      width?: number
      slotTitle?: string
    }
  ) {
    this.title = title
    this.dataIndex = dataIdx
    this.key = options && options.key ? options.key : dataIdx
    this.slots = { customRender: dataIdx }
    if (options && options.slotTitle) {
      this.slots.title = options.slotTitle
    }
    if (options && options.width) {
      this.width = options.width
    }
  }

  static copy(src: any, tgt?: Column): Column {
    tgt = tgt || new Column('', '')
    tgt.key = src.key || src._id || tgt.key
    tgt.title = src.title || tgt.title
    tgt.width = src.width || tgt.width
    tgt.dataIndex = src.dataIndex || tgt.dataIndex
    if (src.slots && src.slots.customRender) {
      tgt.slots.customRender = src.slots.customRender
    }
    if (src.slots && src.slots.title) {
      tgt.slots.title = src.slots.title
    }
    return tgt
  }
}
