import _ from 'lodash'
import Model from './model'

export default class ExpCls {
  key: string
  name: string
  expType: 'typescript' | 'javascript'
  genCopy: boolean
  genReset: boolean

  constructor() {
    this.key = ''
    this.name = ''
    this.expType = 'typescript'
    this.genCopy = true
    this.genReset = true
  }

  reset() {
    this.key = ''
    this.name = ''
    this.expType = 'typescript'
    this.genCopy = true
    this.genReset = true
  }

  update(model: Model): ExpCls {
    this.key = model.key
    this.name = _.upperFirst(model.name)
    return this
  }

  static copy(src: any, tgt?: ExpCls): ExpCls {
    tgt = tgt || new ExpCls()
    tgt.key = src.key || tgt.key
    tgt.name = src.name || tgt.name
    tgt.expType = src.expType || tgt.expType
    tgt.genCopy = src.genCopy || tgt.genCopy
    tgt.genReset = src.genReset || tgt.genReset
    return tgt
  }
}
