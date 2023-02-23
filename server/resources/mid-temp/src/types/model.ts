/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Table from './table'
import Form from './form'
import Property from './property'
import Service from './service'

export default class Model {
  key: string
  name: string
  label: string
  icon: string
  desc: string
  logTime: boolean
  props: Property[]
  form: Form
  table: Table

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.icon = 'BorderlessTableOutlined'
    this.desc = ''
    this.logTime = true
    this.props = []
    this.form = new Form()
    this.table = new Table()
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.icon = 'BorderlessTableOutlined'
    this.desc = ''
    this.logTime = true
    this.props = []
    this.form = new Form()
    this.table = new Table()
  }

  static copy(src: any, tgt?: Model, force = false): Model {
    tgt = tgt || new Model()
    if (typeof src === 'string') {
      tgt.key = src
      return tgt
    }
    const srcId = src.key || src._id
    tgt.key = force ? srcId : srcId || tgt.key
    tgt.name = force ? src.name : src.name || tgt.name
    tgt.label = force ? src.label : src.label || tgt.label
    tgt.icon = force ? src.icon : src.icon || tgt.icon
    tgt.desc = force ? src.desc : src.desc || tgt.desc
    tgt.logTime = force
      ? src.logTime
      : typeof src.logTime !== 'undefined'
      ? src.logTime
      : tgt.logTime
    if (src.props) {
      tgt.props = []
      for (const prop of src.props) {
        tgt.props.push(Property.copy(prop))
      }
    } else if (force) {
      tgt.props = []
    }
    if (src.form) {
      Form.copy(src.form, tgt.form)
    } else {
      tgt.form = new Form()
    }
    if (src.table) {
      Table.copy(src.table, tgt.table)
    } else {
      tgt.table = new Table()
    }
    return tgt
  }
}
