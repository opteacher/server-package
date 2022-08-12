/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Field from './field'

export default class Form {
  key: string
  title: string
  width: number
  labelWidth: number
  fields: Field[]

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

  static copy(src: any, tgt?: Form, force = false): Form {
    tgt = tgt || new Form()
    tgt.key = src.key || src._id || tgt.key
    tgt.title = force ? src.title : src.title || tgt.title
    tgt.width = force ? src.width : src.width || tgt.width
    tgt.labelWidth = force ? src.labelWidth : src.labelWidth || tgt.labelWidth
    tgt.fields = src.fields ? src.fields.map((field: any) => Field.copy(field)) : []
    return tgt
  }
}
