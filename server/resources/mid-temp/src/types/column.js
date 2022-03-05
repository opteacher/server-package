/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Column {
  constructor(title, dataIdx, options) {
    this.title = title
    this.dataIndex = dataIdx
    this.key = options && options.key ? options.key : dataIdx
    if (options && options.width) {
      this.width = options.width
    }
    this.align = options && options.align ? options.align : 'left'
    this.sorter = options && options.sortable ? (a, b) => a[dataIdx] - b[dataIdx] : undefined
    this.defaultSortOrder = options && typeof options.defaultSort !== 'undefined' ? options.defaultSort : ''
  }

  static copy(src, tgt) {
    tgt = tgt || new Column('', '')
    tgt.key = src.key || src._id || tgt.key
    tgt.title = src.title || tgt.title
    tgt.dataIndex = src.dataIndex || tgt.dataIndex
    tgt.width = src.width || tgt.width
    tgt.align = src.align || tgt.align
    tgt.sorter =
      typeof src.sorter !== 'undefined'
        ? src.sorter
        : src.sortable
        ? (a, b) => a[tgt?.dataIndex] - b[tgt?.dataIndex]
        : undefined
    tgt.defaultSortOrder =
      typeof src.defaultSortOrder !== 'undefined'
        ? src.defaultSortOrder
        : typeof src.defaultSort !== 'undefined'
        ? src.defaultSort
        : ''
    return tgt
  }
}
