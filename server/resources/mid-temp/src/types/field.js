'use strict'
export const mgnBtm = 24

export default class Field {
  constructor() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.refer = ''
    this.extra = {}
  }

  reset() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.refer = ''
    this.extra = {}
  }

  static copy(src, tgt) {
    tgt = tgt || new Field()
    tgt.key = src.key || src._id || tgt.key
    tgt.label = src.label || tgt.label
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    tgt.rules = src.rules || tgt.rules
    tgt.refer = src.refer || tgt.refer
    tgt.extra = src.extra || tgt.extra
    return tgt
  }
}
