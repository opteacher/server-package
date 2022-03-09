'use strict'

export default class Property {
  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.type = 'Unknown'
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
  }

  static copy(src, tgt) {
    tgt = tgt || new Property()
    if (typeof src === 'string') {
      tgt.key = src
      return tgt
    }
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.label = src.label || tgt.label
    tgt.type = src.type || tgt.type
    tgt.index = src.index || tgt.index
    tgt.unique = src.unique || tgt.unique
    tgt.visible = src.visible || tgt.visible
    tgt.remark = src.remark || tgt.remark
    return tgt
  }
}
