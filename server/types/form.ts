/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Field from './field.js'

export default class Form {
  key: string
  labelWidth: number
  fields: Field[]

  constructor() {
    this.key = ''
    this.labelWidth = 4
    this.fields = []
  }

  reset() {
    this.key = ''
    this.labelWidth = 4
    this.fields = []
  }

  static copy(src: any, tgt?: Form): Form {
    tgt = tgt || new Form()
    tgt.key = src.key || src._id || tgt.key
    tgt.labelWidth = src.labelWidth || tgt.labelWidth
    tgt.fields = src.fields ? src.fields.map((field: any) => Field.copy(field)) : []
    return tgt
  }
}
