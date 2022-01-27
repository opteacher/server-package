import { getProperty } from "./utils"

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
      return getProperty(object, this.key) !== this.val
    case '=':
    default:
      return getProperty(object, this.key) === this.val
    }
  }

  static copy (src: any, tgt?: Cond): Cond {
    tgt = tgt || new Cond()
    tgt.key = src.key || tgt.key
    tgt.cmp = src.cmp || tgt.cmp
    tgt.val = typeof src.val !== 'undefined' ? src.val : tgt.val
    return tgt
  }
}

export type CompoType = 'Text' | 'Block' | 'Input' | 'Number' | 'Button' | 'Select' | 'Checkbox' | 'Textarea' | 'Cascader' | 'Unknown'

export type OpnType = {
  label: string
  subLabel?: string
  value: any
  children?: any[]
}
export class Mapper {
  [prop: string]: {
    label?: string
    desc?: string
    type: CompoType
    rules?: any[]
    disabled?: boolean | Cond[]
    loading?: boolean
    display?: boolean | Cond[]
    expanded?: boolean
    reset?: boolean
    onChange?: (record: any, to: any, from?: any) => void

    // type = Input
    prefix?: string

    // type = Textarea
    maxRows?: number

    // type = Select,
    options?: string[] | OpnType[]

    // type = Checkbox。0为false，1为true
    chkLabels?: [string, string]

    // type = Button
    inner?: string
    danger?: boolean
    primary?: boolean
    onClick?: () => void

    // type = Table
    dsKey?: string
    mapper?: Mapper
    columns?: Column[]
    copy?: (one: any) => any
    onSaved?: (record: any, extra?: any) => void
    onDeleted?: (key: any, extra?: any) => void
  }

  constructor (init?: any, reset?: boolean) {
    for (const [key, val] of Object.entries(init)) {
      const value = val as any
      this[key] = {
        label: value.label || '',
        desc: value.desc || '',
        type: value.type || 'Unknown',
        rules: value.rules || [],
        disabled: value.disabled && value.disabled.length
          ? value.disabled.map((el: any) => Cond.copy(el))
          : (typeof value.disabled !== 'undefined' ? value.disabled : false),
        display: value.display && value.display.length
          ? value.display.map((el: any) => Cond.copy(el))
          : (typeof value.display !== 'undefined' ? value.display : true),
        expanded: typeof value.expanded !== 'undefined' ? value.expanded : false,
        onChange: value.onChange || (() => { console.log() }),
        reset: typeof value.reset !== 'undefined' ? true : value.reset,
        prefix: value.prefix || '',
        maxRows: value.maxRows || 4,
        options: value.options ? value.options.map((opn: any) => {
          if (typeof opn === 'string') {
            return opn
          } else {
            return {
              title: opn.title,
              value: opn.value,
              subTitle: opn.subTitle || '',
              children: opn.children || []
            }
          }
        }) : [],
        chkLabels: value.chkLabels,
        inner: value.inner || '',
        danger: value.danger || false,
        primary: value.primary || false,
        loading: value.loading || false,
        onClick: value.onClick,
        dsKey: value.dsKey || '',
        columns: value.columns ? value.columns.map((col: any) => Column.copy(col)) : [],
        mapper: value.mapper,
        copy: value.copy,
        onSaved: value.onSaved || ((record: any, extra: any) => {
          console.log(record, extra)
        }),
        onDeleted: value.onDeleted || ((key: any, extra: any) => {
          console.log(key, extra)
        }),
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

  static copy (src: any, tgt?: Column): Column {
    tgt = tgt || new Column('', '')
    tgt.title = src.title || tgt.title
    tgt.dataIndex = src.dataIndex || tgt.dataIndex
    if (src.slots && src.slots.customRender) {
      tgt.slots.customRender = src.slots.customRender
    }
    return tgt
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
  frontend?: Deploy
  models: Model[]
  status: 'starting' | 'stopping' | 'running' | 'stopped' | 'deploying' | 'transferring'

  constructor () {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.path = ''
    this.thread = 0
    this.database = []
    this.models = []
    this.status = 'stopped'
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
    this.status = 'stopped'
  }

  static copy (src: any, tgt?: Project): Project {
    tgt = tgt || new Project()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.desc = src.desc || tgt.desc
    tgt.port = src.port || tgt.port
    tgt.thread = src.thread || 0
    tgt.database = src.database || tgt.database
    if (src.frontend) {
      Deploy.copy(src.frontend, tgt.frontend)
    }
    tgt.path = src.path || `/${tgt.name}/mdl/v1`
    if (src.models) {
      tgt.models = []
      for (const model of src.models) {
        tgt.models.push(Model.copy(model))
      }
    }
    tgt.status = src.status || tgt.status
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
  label: string
  type: string // 字段类型
  index: boolean
  unique: boolean
  visible: boolean
  remark: string

  constructor () {
    this.key = ''
    this.name = ''
    this.label = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
  }

  reset () {
    this.key = ''
    this.name = ''
    this.label = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
  }

  static copy (src: any, tgt?: Property): Property {
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

export class Model {
  key: string
  name: string
  desc: string
  logTime: boolean
  props: Property[]
  routes: Route[]

  constructor () {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.logTime = true
    this.props = []
    this.routes = []
  }

  reset () {
    this.key = ''
    this.name = ''
    this.desc = ''
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
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
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
  'POST', 'PUT', 'DELETE', 'GET'
]

export type BaseTypes = 'Unknown' | 'Number' | 'String' | 'Boolean' | 'Array' | 'Map'
export class Variable {
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

  static copy (src: any, tgt?: Variable): Variable {
    tgt = tgt || new Variable()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.type = src.type || tgt.type
    tgt.value = src.value || tgt.value
    tgt.default = src.default || tgt.default
    tgt.required = src.required || tgt.required
    return tgt
  }
}

export type NodeType = 'normal' | 'condition' | 'condNode' | 'traversal' | 'endNode'

export const NodeTypeMapper = {
  'normal': '普通节点',
  'condition': '条件根节点',
  'condNode': '条件节点',
  'traversal': '遍历节点',
  'endNode': '结束节点',
}
export class Node extends StrIterable {
  key: string
  group: string
  title: string
  desc: string
  type: NodeType
  inputs: Variable[] // [0]参数 [1]槽
  outputs: Variable[]
  code: string
  previous: Node | string | null
  nexts: (Node | string)[]
  relative: string
  temp: string[]

  constructor () {
    super()
    this.key = ''
    this.group = ''
    this.title = ''
    this.desc = ''
    this.type = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
  }

  reset () {
    this.key = ''
    this.group = ''
    this.title = ''
    this.desc = ''
    this.type = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
  }

  static copy (src: any, tgt?: Node, recu = true): Node {
    tgt = tgt || new Node()
    tgt.key = src.key || src._id || tgt.key
    tgt.group = src.group || tgt.group
    tgt.title = src.title || tgt.title
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    if (typeof src.inputs !== 'undefined') {
      tgt.inputs = src.inputs.map((ipt: any) => Variable.copy(ipt))
    }
    if (typeof src.outputs !== 'undefined') {
      tgt.outputs = src.outputs.map((opt: any) => Variable.copy(opt))
    }
    tgt.code = src.code || tgt.code
    if (src.previous) {
      tgt.previous = recu ? Node.copy(src.previous, undefined, false) : src.previous.key
    }
    if (typeof src.nexts !== 'undefined') {
      tgt.nexts = []
      for (const nxt of src.nexts) {
        if (typeof nxt === 'string') {
          tgt.nexts.push(nxt)
        } else {
          tgt.nexts.push(recu ? Node.copy(nxt, undefined, false) : nxt.key)
        }
      }
    }
    tgt.relative = src.relative || tgt.relative
    tgt.temp = src.temp || tgt.temp
    return tgt
  }
}

export const CardMinHgt = 150
export const CardWidth = 300
export const CardHlfWid = CardWidth >> 1
export const ArrowHeight = 100
export const ArrowHlfHgt = ArrowHeight >> 1
export const AddBtnWH = 32
export const AddBtnHlfWH = AddBtnWH >> 1
export const CardGutter = 50
export const CardHlfGutter = CardGutter >> 1

export type NodeInPnl = Node & {
  posLT: [number, number],
  size: [number, number],
  btmSvgHgt: number
}
export class Route {
  key: string
  method: string
  path: string | undefined
  flow: Node | null
  service: string
  interface: string

  constructor () {
    this.key = ''
    this.method = ''
    this.path = undefined
    this.flow = null
    this.service = ''
    this.interface = ''
  }

  reset () {
    this.key = ''
    this.method = ''
    this.path = undefined
    this.flow = null
    this.service = ''
    this.interface = ''
  }

  static copy (src: any, tgt?: Route): Route {
    tgt = tgt || new Route()
    tgt.key = src.key || src._id || tgt.key
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    if (src.flow) {
      tgt.flow = Node.copy(src.flow)
    } else {
      tgt.flow = null
    }
    if (src.service && src.service.length === 2) {
      tgt.service = src.service[0]
      tgt.interface = src.service[1]
    } else {
      tgt.service = src.service || tgt.service
      tgt.interface = src.interface || tgt.interface
    }
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
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.dbs = src.dbs || tgt.dbs
    tgt.host = src.host || tgt.host
    tgt.port = src.port || tgt.port
    tgt.username = src.username || tgt.username
    tgt.password = src.password || tgt.password
    return tgt
  }
}

export class Deploy {
  key: string
  gitURL: string
  name: string
  buildCmd: string
  // * 生成目录，【所在目录】：~/dist/apps/${project.name}/tmp/*
  indexPath: string
  assetsPath: string
  // * 部署目录，【所在目录】：~/app/(assetsPath: public/${project.name}/*|indexPath: views/index.html)
  //    > 位于容器中，由docker container cp复制过去

  constructor () {
    this.key = ''
    this.gitURL = ''
    this.name = ''
    this.buildCmd = 'npm run build'
    this.indexPath = 'public'
    this.assetsPath = 'public/static'
  }

  reset () {
    this.key = ''
    this.gitURL = ''
    this.name = ''
    this.buildCmd = 'npm run build'
    this.indexPath = 'public/index.html'
    this.assetsPath = 'public/static'
  }

  static copy (src: any, tgt?: Deploy): Deploy {
    tgt = tgt || new Deploy()
    tgt.key = src.key || src._id || tgt.key
    tgt.gitURL = src.gitURL || tgt.gitURL
    if (tgt.gitURL) {
      const url = new URL(tgt.gitURL)
      const nameSfx = url.pathname.split('/').pop()
      tgt.name = nameSfx?.substring(0, nameSfx.lastIndexOf('.')) as string
    }
    tgt.buildCmd = src.buildCmd || tgt.buildCmd
    tgt.indexPath = src.indexPath || tgt.indexPath
    tgt.assetsPath = src.assetsPath || tgt.assetsPath
    return tgt
  }
}

export class Transfer {
  file: string[] // 上传文件在服务器的临时位置
  dest: string // 文件投放到docker容器的位置（基于/app）
  project?: string // 项目名，也是docker容器名

  constructor () {
    this.file = []
    this.dest = ''
  }

  reset () {
    this.file = []
    this.dest = ''
  }

  static copy (src: any, tgt?: Transfer): Transfer {
    tgt = tgt || new Transfer()
    tgt.file = src.file || tgt.file
    tgt.dest = src.dest || tgt.dest
    tgt.project = src.project || tgt.project
    return tgt
  }
}
