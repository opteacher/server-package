/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { pickOrIgnore } from '@/utils'
import Compo from './compo'
import { getCopy, MapperType } from './mapper'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const mgnBtm = 24

export default class Field {
  key: string
  label: string
  desc: string
  ftype: string // 表单组件类型
  rules: any[]
  refer: string
  placeholder: string
  extra: any

  constructor() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.ftype = ''
    this.rules = []
    this.refer = ''
    this.placeholder = ''
    this.extra = {}
  }

  reset() {
    this.key = ''
    this.label = ''
    this.desc = ''
    this.ftype = ''
    this.rules = []
    this.refer = ''
    this.placeholder = ''
    this.extra = {}
  }

  static copy(src: any, tgt?: Field, force = false): Field {
    tgt = tgt || new Field()
    const srcKey = src.key || src._id || ''
    tgt.key = force ? srcKey : srcKey || tgt.key
    tgt.label = force ? src.label : src.label || tgt.label
    tgt.desc = force ? src.desc : src.desc || tgt.desc
    tgt.ftype = force ? src.ftype : src.ftype || tgt.ftype
    tgt.rules = force ? src.rules : src.rules || tgt.rules
    tgt.refer = force ? src.refer : src.refer || tgt.refer
    tgt.placeholder = force ? src.placeholder : src.placeholder || tgt.placeholder
    tgt.extra = force ? src.extra : src.extra || tgt.extra
    return tgt
  }

  static cpyFmCmp(src: Compo, tgt?: Field): Field {
    tgt = tgt || new Field()
    tgt.ftype = src.name
    tgt.extra = src.extra
    return tgt
  }

  toMapper(): MapperType {
    const ret = pickOrIgnore(this, ['label', 'desc', 'rules', 'placeholder'], false)
    ret.type = this.ftype
    return getCopy(Object.assign(ret, this.extra))
  }
}
