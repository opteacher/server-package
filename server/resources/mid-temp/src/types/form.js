'use strict'
import Field from './field'

export default class Form {
  constructor() {
    this.key = ''
    this.title = ''
    this.width = 0
    this.labelWidth = 0
    this.fields = []
  }

  reset() {
    this.key = ''
    this.title = ''
    this.width = 0
    this.labelWidth = 0
    this.fields = []
  }

  static copy(src, tgt) {
    tgt = tgt || new Form()
    tgt.key = src.key || src._id || tgt.key
    tgt.title = src.title || tgt.title
    tgt.width = src.width || tgt.width
    tgt.labelWidth = src.labelWidth || tgt.labelWidth
    tgt.fields = src.fields ? src.fields.map(field => Field.copy(field)) : []
    return tgt
  }
}
