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
  svcs: Service[]
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
    this.svcs = []
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
    this.svcs = []
    this.form = new Form()
    this.table = new Table()
  }

  static copy(src: any, tgt?: Model): Model {
    tgt = tgt || new Model()
    if (typeof src === 'string') {
      tgt.key = src
      return tgt
    }
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.label = src.label || tgt.label
    tgt.icon = src.icon || tgt.icon
    tgt.desc = src.desc || tgt.desc
    if (typeof src.logTime !== 'undefined') {
      tgt.logTime = src.logTime
    }
    if (src.props) {
      tgt.props = []
      for (const prop of src.props) {
        tgt.props.push(Property.copy(prop))
      }
    }
    if (src.svcs && src.svcs.length) {
      tgt.svcs = src.svcs.map((svc: any) => Service.copy(svc))
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
