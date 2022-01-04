export class StrIterable {
  [idx: string]: any
}

export class Cond {
  key: string
  cmp?: '=' | '!=' | 'in'
  val: any

  constructor () {
    this.key = ''
    this.val = undefined
  }

  isValid (object: StrIterable) {
    switch (this.cmp) {
    case '!=':
      return object[this.key] !== this.val
    case '=':
    default:
      return object[this.key] === this.val
    }
  }

  public static copy (src: any, tgt?: Cond): Cond {
    tgt = tgt || new Cond()
    tgt.key = src.key || tgt.key
    tgt.cmp = src.cmp || tgt.cmp
    tgt.val = typeof src.val !== 'undefined' ? src.val : tgt.val
    return tgt
  }
}

export type CompoType = 'Block' | 'Input' | 'Number' | 'Button' | 'Select' | 'Checkbox' | 'Textarea' | 'Cascader' | 'Unknown'

export class Mapper {
  [prop: string]: {
    label?: string
    desc?: string
    type: CompoType
    rules?: any[]
    disabled?: boolean | Cond
    display?: boolean | Cond
    expanded?: boolean
    changes?: {
      cond: Cond
      attr: Cond
    }[]
    // type = Select
    options?: string[] | {
      title: string
      subTitle?: string
      value: any
    }[]
    // type = Checkbox。0为false，1为true
    chkLabels?: [string, string]
    // type = Button
    inner?: string
    danger?: boolean
    loading?: boolean
    onClick?: () => void
  }

  constructor (init?: any) {
    for (const [key, val] of Object.entries(init)) {
      const value = val as any
      this[key] = {
        label: value.label || '',
        desc: value.desc || '',
        type: value.type || 'Unknown',
        rules: value.rules || [],
        disabled: value.disabled instanceof Cond ? Cond.copy(value.disabled) : (
          typeof value.disabled !== 'undefined' ? value.disabled : false
        ),
        display: value.display instanceof Cond ? Cond.copy(value.display) : (
          typeof value.display !== 'undefined' ? value.display : true
        ),
        expanded: typeof value.expanded !== 'undefined' ? value.expanded : false,
        changes: value.changes ? value.changes.map((chg: any) => ({
          cond: Cond.copy(chg.cond),
          attr: Cond.copy(chg.attr),
        })) : [],
        options: value.options ? value.options.map((opn: any) => {
          if (typeof opn === 'string') {
            return opn
          } else {
            return {
              title: opn.title, value: opn.value
            }
          }
        }) : [],
        chkLabels: value.chkLabels || undefined,
        inner: value.inner || '',
        danger: value.danger || false,
        loading: value.loading || false,
        onClick: value.onClick || undefined
      }
    }
  }
}

export class Column {
  title: string
  dataIndex: string
  key: string
  slots: {
    customRender: string
  }

  constructor (title: string, dataIdx: string) {
    this.title = title
    this.dataIndex = dataIdx
    this.key = dataIdx
    this.slots = { customRender: dataIdx }
  }
}

export class Project {
  key: string
  name: string
  desc: string
  port: number
  path: string
  thread: number
  database: string[]
  models: Model[]

  constructor () {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.path = ''
    this.thread = 0
    this.database = []
    this.models = []
  }

  reset () {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.path = ''
    this.thread = 0
    this.database = []
    this.models = []
  }

  static copy (src: any, tgt?: Project): Project {
    tgt = tgt || new Project()
    tgt.key = src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.desc = src.desc || tgt.desc
    tgt.port = src.port || tgt.port
    tgt.thread = src.thread || 0
    tgt.database = src.database || tgt.database
    tgt.path = src.path || `/${tgt.name}/mdl/v1`
    if (src.models) {
      tgt.models = []
      for (const model of src.models) {
        tgt.models.push(Model.copy(model))
      }
    }
    return tgt
  }
}

export class Field {
  label: string
  desc: string
  type: string // 表单组件类型
  rules: any[]
  disabled: boolean
  display: boolean
  options: string[] | {
    title: string
    subTitle?: string
    value: any
  }[]
  chkLabels: [string, string]

  constructor () {
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.disabled = false
    this.display = true
    this.options = []
    this.chkLabels = ['', '']
  }

  reset () {
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.disabled = false
    this.display = true
    this.options = []
    this.chkLabels = ['', '']
  }

  static copy (src: any, tgt?: Field): Field {
    tgt = tgt || new Field()
    tgt.label = src.label || tgt.label
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    tgt.rules = src.rules || tgt.rules
    tgt.disabled = src.disabled || tgt.disabled
    tgt.display = src.display || tgt.display
    tgt.options = src.options || tgt.options
    tgt.chkLabels = src.chkLabels || tgt.chkLabels
    return tgt
  }
}

export const baseTypes = [
  'Id', 'String', 'Number', 'Date', 'Boolean', 'Array', 'Object'
]

export class Property {
  key: string
  name: string
  type: string // 字段类型
  index: boolean
  unique: boolean
  visible: boolean
  field: Field

  constructor () {
    this.key = ''
    this.name = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.field = new Field()
  }

  reset () {
    this.key = ''
    this.name = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.field = new Field()
  }

  static copy (src: any, tgt?: Property): Property {
    tgt = tgt || new Property()
    if (typeof src === 'string') {
      tgt.key = src
      return tgt
    }
    tgt.key = src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.type = src.type || tgt.type
    tgt.index = src.index || tgt.index
    tgt.unique = src.unique || tgt.unique
    tgt.visible = src.visible || tgt.visible
    if (src.field) {
      Field.copy(src.field, tgt.field)
    }
    return tgt
  }
}

export class Model {
  key: string
  name: string
  logTime: boolean
  props: Property[]
  routes: Route[]

  constructor () {
    this.key = ''
    this.name = ''
    this.logTime = true
    this.props = []
    this.routes = []
  }

  reset () {
    this.key = ''
    this.name = ''
    this.logTime = true
    this.props = []
    this.routes = []
  }

  static copy (src: any, tgt?: Model): Model {
    tgt = tgt || new Model()
    if (typeof src === 'string') {
      tgt.key = src
      return tgt
    }
    tgt.key = src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.logTime = src.logTime || tgt.logTime
    if (src.props) {
      tgt.props = []
      for (const prop of src.props) {
        tgt.props.push(Property.copy(prop))
      }
    }
    if (src.routes) {
      tgt.routes = []
      for (const route of src.routes) {
        tgt.routes.push(Route.copy(route))
      }
    }
    return tgt
  }
}

export const routeMethods = [
  'POST', 'PUT', 'DELETE', 'GET', 'ALL'
]

export type BaseTypes = 'Unknown' | 'Number' | 'String' | 'Boolean' | 'Array' | 'Map'
export class Attr {
  key: string
  name: string
  type: BaseTypes | Model
  value: any
  default: any
  required: boolean

  constructor () {
    this.key = ''
    this.name = ''
    this.type = 'Unknown'
    this.value = undefined
    this.default = undefined
    this.required = false
  }

  reset () {
    this.key = ''
    this.name = ''
    this.type = 'Unknown'
    this.value = undefined
    this.default = undefined
    this.required = false
  }

  static copy (src: any, tgt?: Attr): Attr {
    tgt = tgt || new Attr()
    tgt.key = src._id || tgt.key
    tgt.name = src._name || tgt.name
    tgt.type = src._type || tgt.type
    tgt.value = src._value || tgt.value
    tgt.default = src._default || tgt.default
    tgt.required = src._required || tgt.required
    return tgt
  }
}

type NodeType = 'normal' | 'condition' | 'traversal'

export class Node {
  key: string
  type: NodeType
  inputs: [string, Attr][] // [0]参数 [1]槽
  outputs: Attr[]
  code: string
  previous: Node | null
  nexts: Node[]

  constructor () {
    this.key = ''
    this.type = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.previous = null
    this.nexts = []
  }

  reset () {
    this.key = ''
    this.type = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.previous = null
    this.nexts = []
  }

  static copy (src: any, tgt?: Node): Node {
    tgt = tgt || new Node()
    tgt.key = src._id || tgt.key
    tgt.type = src._type || tgt.type
    if (src.inputs.length) {
      tgt.inputs = src.inputs.map((ipt: any) => Attr.copy(ipt))
    }
    tgt.outputs = src.outputs || tgt.outputs
    tgt.code = src.code || tgt.code
    tgt.previous = src.previous || tgt.previous
    tgt.nexts = src.nexts || tgt.nexts
    return tgt
  }
}

export class Route {
  key: string
  method: string
  flow: Node | null

  constructor () {
    this.key = ''
    this.method = ''
    this.flow = new Node()
  }

  static copy (src: any, tgt?: Route): Route {
    tgt = tgt || new Route()
    tgt.key = src._id || tgt.key
    tgt.method = src.method || tgt.method
    tgt.flow = src.flow || tgt.flow
    return tgt
  }
}

export class DataBase {
  key: string
  name: string
  dbs: string[]
  host: string
  port: number
  username: string
  password: string

  constructor () {
    this.key = ''
    this.name = ''
    this.dbs = []
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  reset () {
    this.key = ''
    this.name = ''
    this.dbs = []
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  static copy (src: any, tgt?: DataBase): DataBase {
    tgt = tgt || new DataBase()
    tgt.key = src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.dbs = src.dbs || tgt.dbs
    tgt.host = src.host || tgt.host
    tgt.port = src.port || tgt.port
    tgt.username = src.username || tgt.username
    tgt.password = src.password || tgt.password
    return tgt
  }
}
