import Table from '../types/table'

export default class Model {
  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.form = null
    this.table = null
  }

  static copy(src, tgt) {
    tgt = tgt || new Model()
    tgt.key = src.key || src._id || src.id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.desc = src.desc || tgt.desc
    if (src.form) {
      Form.copy(src.form, tgt.form)
    } else {
      tgt.form = undefined
    }
    if (src.table) {
      Table.copy(src.table, tgt.table)
    } else {
      tgt.table = undefined
    }
    return tgt
  }
}
