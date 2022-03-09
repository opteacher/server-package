'use strict'
import Table from '../types/table'
import Form from '../types/form'

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
    if (src.form && typeof src.form !== 'string') {
      Form.copy(src.form, tgt.form)
    } else {
      tgt.form = src.form
    }
    if (src.table && typeof src.table !== 'string') {
      Table.copy(src.table, tgt.table)
    } else {
      tgt.table = src.table
    }
    return tgt
  }
}
