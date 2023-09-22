/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Table from './table'
import Form from '@/types/form'
import Property from './property'
import Service, { Method } from './service'
import { gnlCpy } from '@/utils'

export default class Model {
  key: string
  name: string
  label: string
  disp: boolean
  icon: string
  desc: string
  logTime: boolean
  methods: Method[]
  props: Property[]
  form: Form
  table: Table

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.disp = true
    this.icon = 'BorderlessTableOutlined'
    this.desc = ''
    this.logTime = true
    this.methods = ['POST', 'DELETE', 'PUT', 'GET']
    this.props = []
    this.form = new Form()
    this.table = new Table()
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.disp = true
    this.icon = 'BorderlessTableOutlined'
    this.desc = ''
    this.logTime = true
    this.methods = ['POST', 'DELETE', 'PUT', 'GET']
    this.props = []
    this.form = new Form()
    this.table = new Table()
  }

  static copy(src: any, tgt?: Model, force = false): Model {
    return gnlCpy(Model, src, tgt, {
      force,
      cpyMapper: { props: Property.copy, form: Form.copy, table: Table.copy }
    })
  }
}
