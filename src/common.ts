/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { getProperty } from './utils'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { ref, Ref } from 'vue'

export class StrIterable {
  [idx: string]: any
}

export class Cond {
  key: string
  cmp?: '=' | '!=' | 'in'
  val: any

  constructor() {
    this.key = ''
    this.val = undefined
  }

  isValid(object: StrIterable) {
    switch (this.cmp) {
      case '!=':
        return getProperty(object, this.key) !== this.val
      case '=':
      default:
        return getProperty(object, this.key) === this.val
    }
  }

  static copy(src: any, tgt?: Cond): Cond {
    tgt = tgt || new Cond()
    tgt.key = src.key || tgt.key
    tgt.cmp = src.cmp || tgt.cmp
    tgt.val = typeof src.val !== 'undefined' ? src.val : tgt.val
    return tgt
  }
}

export type CompoType =
  | 'Text'
  | 'Block'
  | 'Input'
  | 'Number'
  | 'Button'
  | 'Select'
  | 'DateTime'
  | 'Checkbox'
  | 'Switch'
  | 'Button'
  | 'Table'
  | 'Textarea'
  | 'Delable'
  | 'SelOrIpt'
  | 'Upload'
  | 'Cascader'
  | 'ListSelect'
  | 'EditList'
  | 'Unknown'

export type OpnType = {
  label: string
  subLabel?: string
  value: any
  children?: any[]
}

export type CmpRel = 'AND' | 'OR'
export class BaseMapper extends StrIterable {
  label: string
  desc: string
  type: CompoType
  rules: any[]
  disabled: boolean | Cond[] | { [cmpRel: string]: Cond[] }
  loading: boolean
  display: boolean | Cond[] | { [cmpRel: string]: Cond[] }
  expanded: boolean
  reset: boolean
  empty: boolean
  onChange: (record: any, to: any, from?: any, extra?: any) => void

  constructor() {
    super()
    this.label = ''
    this.desc = ''
    this.type = 'Unknown'
    this.rules = []
    this.disabled = false
    this.loading = false
    this.display = true
    this.expanded = false
    this.reset = true
    this.empty = false
    this.onChange = () => undefined
  }

  static copy(src: any, tgt?: BaseMapper): BaseMapper {
    tgt = tgt || new BaseMapper()
    tgt.label = src.label || tgt.label
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    tgt.rules = src.rules || tgt.rules
    tgt.disabled =
      src.disabled && src.disabled.length
        ? src.disabled.map((el: any) => Cond.copy(el))
        : typeof src.disabled !== 'undefined'
        ? src.disabled
        : tgt.disabled
    tgt.display =
      src.display && src.display.length
        ? src.display.map((el: any) => Cond.copy(el))
        : typeof src.display !== 'undefined'
        ? src.display
        : tgt.display
    tgt.expanded = typeof src.expanded !== 'undefined' ? src.expanded : tgt.expanded
    tgt.empty = typeof src.empty !== 'undefined' ? src.empty : tgt.empty
    tgt.onChange = src.onChange || tgt.onChange
    return tgt
  }
}

export class InputMapper extends BaseMapper {
  prefix: string
  suffix: string

  constructor() {
    super()
    this.prefix = ''
    this.suffix = ''
  }

  static copy(src: any, tgt?: InputMapper): InputMapper {
    tgt = tgt || new InputMapper()
    BaseMapper.copy(src, tgt)
    tgt.prefix = src.prefix || tgt.prefix
    tgt.suffix = src.suffix || tgt.suffix
    return tgt
  }
}

export class TextareaMapper extends BaseMapper {
  maxRows: number

  constructor() {
    super()
    this.maxRows = 3
  }

  static copy(src: any, tgt?: TextareaMapper): TextareaMapper {
    tgt = tgt || new TextareaMapper()
    BaseMapper.copy(src, tgt)
    tgt.maxRows = src.maxRows || tgt.maxRows
    return tgt
  }
}

export class SelectMapper extends BaseMapper {
  loading: boolean
  options: string[] | OpnType[]
  onDropdown: (open: boolean) => void

  constructor() {
    super()
    this.loading = false
    this.options = []
    this.onDropdown = () => undefined
  }

  static copy(src: any, tgt?: SelectMapper): SelectMapper {
    tgt = tgt || new SelectMapper()
    BaseMapper.copy(src, tgt)
    tgt.loading = typeof src.loading !== 'undefined' ? src.loading : tgt.loading
    tgt.options = src.options
      ? src.options.map((opn: any) => {
          if (typeof opn === 'string') {
            return opn
          } else {
            return {
              label: opn.label,
              value: opn.value,
              subLabel: opn.subLabel || '',
              children: opn.children || []
            }
          }
        })
      : tgt.options
    tgt.onDropdown = src.onDropdown || tgt.onDropdown
    return tgt
  }
}

export class CheckboxMapper extends BaseMapper {
  // 0为false，1为true
  chkLabels: [string, string]

  constructor() {
    super()
    this.chkLabels = ['否', '是']
  }

  static copy(src: any, tgt?: CheckboxMapper): CheckboxMapper {
    tgt = tgt || new CheckboxMapper()
    BaseMapper.copy(src, tgt)
    tgt.chkLabels = src.chkLabels || tgt.chkLabels
    return tgt
  }
}

export class ButtonMapper extends BaseMapper {
  inner: string
  danger: boolean
  primary: boolean
  onClick: () => void

  constructor() {
    super()
    this.inner = ''
    this.danger = false
    this.primary = true
    this.onClick = () => undefined
  }

  static copy(src: any, tgt?: ButtonMapper): ButtonMapper {
    tgt = tgt || new ButtonMapper()
    BaseMapper.copy(src, tgt)
    tgt.inner = src.inner || tgt.inner
    tgt.danger = src.danger || tgt.danger
    tgt.primary = src.primary || tgt.primary
    tgt.onClick = src.onClick || tgt.onClick
    return tgt
  }
}

export class TableMapper extends BaseMapper {
  show: boolean
  mapper: Mapper
  columns: Column[]
  emitter: Emitter
  copy: (one: any) => any
  onSaved: (record: any, extra?: any) => void
  onDeleted: (key: any, extra?: any) => void
  addable: boolean | Cond[] | { [cmpRel: string]: Cond[] }
  edtable: boolean | Cond[] | { [cmpRel: string]: Cond[] }
  delable: boolean | Cond[] | { [cmpRel: string]: Cond[] }

  constructor() {
    super()
    this.show = false
    this.mapper = new Mapper()
    this.columns = []
    this.emitter = new Emitter()
    this.copy = () => undefined
    this.onSaved = () => undefined
    this.onDeleted = () => undefined
    this.addable = true
    this.edtable = true
    this.delable = true
  }

  static copy(src: any, tgt?: TableMapper): TableMapper {
    tgt = tgt || new TableMapper()
    BaseMapper.copy(src, tgt)
    tgt.show = src.show || tgt.show
    tgt.mapper = src.mapper ? Mapper.copy(src.mapper, tgt.mapper) : tgt.mapper
    tgt.columns = src.columns || tgt.columns
    tgt.emitter = src.emitter || tgt.emitter
    tgt.copy = src.copy || tgt.copy
    tgt.onSaved = src.onSaved || tgt.onSaved
    tgt.onDeleted = src.onDeleted || tgt.onDeleted
    tgt.addable = src.addable || tgt.addable
    tgt.edtable = src.edtable || tgt.edtable
    tgt.delable = src.delable || tgt.delable
    return tgt
  }
}

export class SelOrIptMapper extends BaseMapper {
  mode: 'select' | 'input'
  options: OpnType[]

  constructor() {
    super()
    this.mode = 'input'
    this.options = []
  }

  static copy(src: any, tgt?: SelOrIptMapper): SelOrIptMapper {
    tgt = tgt || new SelOrIptMapper()
    BaseMapper.copy(src, tgt)
    tgt.mode = src.mode || tgt.mode
    tgt.options = src.options || tgt.options
    return tgt
  }
}

export class LstOpnType {
  key: string
  title: string
  subTitle?: string
  avatar?: string
  href?: string

  constructor() {
    this.key = ''
    this.title = ''
  }

  static copy(src: any, tgt?: LstOpnType): LstOpnType {
    tgt = tgt || new LstOpnType()
    tgt.title = src.title || tgt.title
    tgt.key = src.key || tgt.key
    tgt.subTitle = src.subTitle || tgt.subTitle
    tgt.avatar = src.avatar || tgt.avatar
    tgt.href = src.href || tgt.href
    return tgt
  }
}

export class LstSelMapper extends BaseMapper {
  options: LstOpnType[]

  constructor() {
    super()
    this.options = []
  }

  static copy(src: any, tgt?: LstSelMapper): LstSelMapper {
    tgt = tgt || new LstSelMapper()
    BaseMapper.copy(src, tgt)
    tgt.options = src.options ? src.options.map((opn: any) => LstOpnType.copy(opn)) : tgt.options
    return tgt
  }
}

export class EditListMapper extends BaseMapper {
  addMod: Ref<boolean>
  mode: 'select' | 'input'
  options: OpnType[]

  constructor() {
    super()
    this.addMod = ref(false)
    this.mode = 'input'
    this.options = []
  }

  static copy(src: any, tgt?: EditListMapper): EditListMapper {
    tgt = tgt || new EditListMapper()
    BaseMapper.copy(src, tgt)
    if (src.addMod) {
      tgt.addMod.value = src.addMod.value || src.addMod || tgt.addMod.value
    }
    tgt.mode = src.mode || tgt.mode
    tgt.options = src.options || tgt.options
    return tgt
  }
}

const EleTypeCopies = {
  Unknown: BaseMapper.copy,
  Input: InputMapper.copy,
  Number: InputMapper.copy,
  Textarea: TextareaMapper.copy,
  Select: SelectMapper.copy,
  Cascader: SelectMapper.copy,
  Checkbox: CheckboxMapper.copy,
  Switch: CheckboxMapper.copy,
  Button: ButtonMapper.copy,
  Table: TableMapper.copy,
  Text: BaseMapper.copy,
  Delable: TableMapper.copy,
  SelOrIpt: SelOrIptMapper.copy,
  Upload: BaseMapper.copy,
  DateTime: BaseMapper.copy,
  ListSelect: LstSelMapper.copy,
  EditList: EditListMapper.copy
} as { [elType: string]: (src: any, tgt?: any) => any }
export class Mapper {
  [prop: string]: BaseMapper

  constructor(init?: any) {
    if (init) {
      for (const [key, val] of Object.entries(init)) {
        const value = val as BaseMapper
        if (!value.type) {
          value.type = 'Unknown'
        }
        this[key] = EleTypeCopies[value.type](value)
      }
    }
  }

  static copy(src: any, tgt?: Mapper): Mapper {
    tgt = tgt || new Mapper()
    for (const [key, val] of Object.entries(src)) {
      const value = val as BaseMapper
      if (!value.type) {
        value.type = 'Unknown'
      }
      tgt[key] = EleTypeCopies[value.type](value)
    }
    return tgt
  }
}

export class Column {
  title: string
  dataIndex: string
  key: string
  width?: number
  slots: {
    title?: string
    customRender: string
  }

  constructor(
    title: string,
    dataIdx: string,
    options?: {
      width?: number
      slotTitle?: string
    }
  ) {
    this.title = title
    this.dataIndex = dataIdx
    this.key = dataIdx
    this.slots = { customRender: dataIdx }
    if (options && options.slotTitle) {
      this.slots.title = options.slotTitle
    }
    if (options && options.width) {
      this.width = options.width
    }
  }

  static copy(src: any, tgt?: Column): Column {
    tgt = tgt || new Column('', '')
    tgt.title = src.title || tgt.title
    tgt.dataIndex = src.dataIndex || tgt.dataIndex
    if (src.slots && src.slots.customRender) {
      tgt.slots.customRender = src.slots.customRender
    }
    if (src.slots && src.slots.title) {
      tgt.slots.title = src.slots.title
    }
    tgt.width = src.width || tgt.width
    return tgt
  }
}

export class API {
  key: string
  svc: string
  model: string
  method: string
  path: string
  roles: string[]

  constructor() {
    this.key = ''
    this.svc = ''
    this.model = ''
    this.method = 'GET'
    this.path = ''
    this.roles = []
  }

  static copy(src: any, tgt?: API): API {
    tgt = tgt || new API()
    tgt.key = src.key || src._id || tgt.key
    tgt.svc = src.svc || tgt.svc
    tgt.model = src.model || tgt.model
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.roles = src.roles || tgt.roles
    return tgt
  }
}

export class Project {
  key: string
  name: string
  desc: string
  port: number
  thread: number
  database: string[]
  dropDbs: boolean
  commands: string
  frontend?: Deploy
  models: Model[]
  auth: Auth | null
  status: 'loading' | 'running' | 'stopped'

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.thread = 0
    this.database = []
    this.dropDbs = false
    this.commands = ''
    this.models = []
    this.auth = null
    this.status = 'stopped'
  }

  reset() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.thread = 0
    this.database = []
    this.dropDbs = false
    this.commands = ''
    this.models = []
    this.auth = null
    this.status = 'stopped'
  }

  static copy(src: any, tgt?: Project): Project {
    tgt = tgt || new Project()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.desc = src.desc || tgt.desc
    tgt.port = src.port || tgt.port
    tgt.thread = src.thread || 0
    tgt.database = src.database || tgt.database
    tgt.dropDbs = src.dropDbs || tgt.dropDbs
    tgt.commands = src.commands || tgt.commands
    if (src.frontend) {
      Deploy.copy(src.frontend, tgt.frontend)
    }
    if (src.models) {
      tgt.models.splice(0, tgt.models.length)
      for (const model of src.models) {
        tgt.models.push(Model.copy(model))
      }
    }
    tgt.auth = src.auth ? Auth.copy(src.auth) : null
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
  options:
    | string[]
    | {
        title: string
        subTitle?: string
        value: any
      }[]
  chkLabels: [string, string]

  constructor() {
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.disabled = false
    this.display = true
    this.options = []
    this.chkLabels = ['', '']
  }

  reset() {
    this.label = ''
    this.desc = ''
    this.type = ''
    this.rules = []
    this.disabled = false
    this.display = true
    this.options = []
    this.chkLabels = ['', '']
  }

  static copy(src: any, tgt?: Field): Field {
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
  'Unknown',
  'String',
  'Number',
  'DateTime',
  'Boolean',
  'Array',
  'Object',
  'Any'
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

  constructor() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.label = ''
    this.type = ''
    this.index = false
    this.unique = false
    this.visible = true
    this.remark = ''
  }

  static copy(src: any, tgt?: Property): Property {
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
  svcs: Service[]

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.logTime = true
    this.props = []
    this.svcs = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.logTime = true
    this.props = []
    this.svcs = []
  }

  static copy(src: any, tgt?: Model): Model {
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
    if (src.svcs && src.svcs.length) {
      tgt.svcs = src.svcs.map((svc: any) => Service.copy(svc))
    }
    return tgt
  }
}

export const methods = ['POST', 'PUT', 'DELETE', 'GET']

export type BaseTypes =
  | 'Unknown'
  | 'Number'
  | 'String'
  | 'Boolean'
  | 'DateTime'
  | 'Array'
  | 'Object'
  | 'Any'
export class Variable {
  key: string
  name: string
  type: BaseTypes | Model
  value: any
  prop: string
  index: string
  idxType: BaseTypes
  default: any
  required: boolean
  remark: string

  constructor() {
    this.key = ''
    this.name = ''
    this.type = 'Unknown'
    this.value = undefined
    this.prop = ''
    this.index = ''
    this.idxType = 'Unknown'
    this.default = undefined
    this.required = false
    this.remark = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.type = 'Unknown'
    this.value = undefined
    this.prop = ''
    this.index = ''
    this.idxType = 'Unknown'
    this.default = undefined
    this.required = false
    this.remark = ''
  }

  static copy(src: any, tgt?: Variable): Variable {
    tgt = tgt || new Variable()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.type = src.type || tgt.type
    tgt.value = src.value || tgt.value
    tgt.prop = src.prop || tgt.prop
    tgt.index = src.index || tgt.index
    tgt.idxType = src.idxType || tgt.idxType
    tgt.default = src.default || tgt.default
    tgt.required = src.required || tgt.required
    tgt.remark = src.remark || tgt.remark
    return tgt
  }
}

export type NodeType = 'normal' | 'condition' | 'condNode' | 'traversal' | 'endNode'

export const NodeTypeMapper = {
  normal: '普通节点',
  condition: '条件根节点',
  condNode: '条件节点',
  traversal: '遍历节点',
  endNode: '结束节点'
}
export class Node extends StrIterable {
  key: string
  isTemp: boolean
  group: string
  title: string
  desc: string
  type: NodeType
  inputs: Variable[] // [0]参数 [1]槽
  outputs: Variable[]
  isFun: boolean
  code: string
  previous: string | null
  nexts: string[]
  relative: string
  temp: string[]
  deps: Dep[]

  constructor() {
    super()
    this.key = ''
    this.isTemp = false
    this.group = ''
    this.title = ''
    this.desc = ''
    this.type = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.isFun = true
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
    this.deps = []
  }

  reset() {
    this.key = ''
    this.isTemp = false
    this.group = ''
    this.title = ''
    this.desc = ''
    this.type = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.isFun = true
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
    this.deps = []
  }

  static copy(src: any, tgt?: Node): Node {
    tgt = tgt || new Node()
    tgt.key = src.key || src._id || tgt.key
    tgt.isTemp = typeof src.isTemp !== 'undefined' ? src.isTemp : tgt.isTemp
    tgt.group = src.group || tgt.group
    tgt.title = src.title || tgt.title
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    if (src.inputs instanceof Array) {
      tgt.inputs = src.inputs.map((ipt: any) => Variable.copy(ipt))
    }
    if (src.outputs instanceof Array) {
      tgt.outputs = src.outputs.map((opt: any) => Variable.copy(opt))
    }
    tgt.code = src.code || tgt.code
    tgt.isFun = typeof src.isFun !== 'undefined' ? src.isFun : tgt.isFun
    tgt.previous = src.previous
      ? src.previous.key || src.previous._id || src.previous
      : src.previous
    if (src.nexts instanceof Array) {
      tgt.nexts = src.nexts.map((nxt: any) => nxt.key || nxt._id || nxt)
    }
    tgt.relative = src.relative || tgt.relative
    tgt.temp = src.temp || tgt.temp
    tgt.deps = src.deps ? src.deps.map((dep: any) => Dep.copy(dep)) : []
    return tgt
  }
}

export type EmitType = 'api' | 'timeout' | 'interval' | 'none'

export const emitTypeOpns = [
  {
    label: '网络接口',
    value: 'api'
  },
  {
    label: '延时',
    value: 'timeout'
  },
  {
    label: '定时',
    value: 'interval'
  },
  {
    label: '无',
    value: 'none'
  }
] as OpnType[]

export class Service {
  key: string
  name: string
  interface: string
  emit: EmitType
  flow: Node | null
  isModel: boolean
  model: string
  method: string
  path: string | undefined
  jobId: number
  emitCond: string
  cdValue: number
  cdUnit: string

  constructor() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.isModel = false
    this.model = ''
    this.method = ''
    this.path = undefined
    this.jobId = 0
    this.emitCond = ''
    this.cdValue = 1
    this.cdUnit = 's'
  }

  reset() {
    this.key = ''
    this.name = ''
    this.interface = ''
    this.emit = 'api'
    this.flow = null
    this.isModel = false
    this.model = ''
    this.method = ''
    this.path = undefined
    this.jobId = 0
    this.emitCond = ''
    this.cdValue = 1
    this.cdUnit = 's'
  }

  static copy(src: any, tgt?: Service): Service {
    tgt = tgt || new Service()
    tgt.key = src.key || src._id || tgt.key
    if (src.service && src.service.length === 2) {
      tgt.name = src.service[0]
      tgt.interface = src.service[1]
    } else {
      tgt.name = src.name || tgt.name
      tgt.interface = src.interface || tgt.interface
    }
    tgt.emit = src.emit || tgt.emit
    if (src.flow) {
      tgt.flow = Node.copy(src.flow)
    } else {
      tgt.flow = null
    }
    tgt.isModel = src.isModel || tgt.isModel
    tgt.model = src.model || tgt.model
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.jobId = src.jobId || tgt.jobId
    tgt.emitCond = src.emitCond || tgt.emitCond
    const emtNum = /^\d+/.exec(tgt.emitCond)
    tgt.cdValue = src.cdValue || (tgt.emitCond && emtNum && emtNum.length ? emtNum[0] : tgt.cdValue)
    const emtUnt = /(Y|M|W|D|h|m|s|ms)$/.exec(tgt.emitCond)
    tgt.cdUnit = src.cdUnit || (tgt.emitCond && emtUnt && emtUnt.length ? emtUnt[0] : tgt.cdUnit)
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

  constructor() {
    this.key = ''
    this.name = ''
    this.dbs = []
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.dbs = []
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  static copy(src: any, tgt?: DataBase): DataBase {
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

  constructor() {
    this.key = ''
    this.gitURL = ''
    this.name = ''
    this.buildCmd = 'npm run build'
    this.indexPath = 'public'
    this.assetsPath = 'public/static'
  }

  reset() {
    this.key = ''
    this.gitURL = ''
    this.name = ''
    this.buildCmd = 'npm run build'
    this.indexPath = 'public/index.html'
    this.assetsPath = 'public/static'
  }

  static copy(src: any, tgt?: Deploy): Deploy {
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

export class Dep {
  key: string
  name: string
  exports: string[]
  from: string
  default: boolean

  constructor() {
    this.key = ''
    this.name = ''
    this.exports = []
    this.from = ''
    this.default = true
  }

  static copy(src: any, tgt?: Dep): Dep {
    tgt = tgt || new Dep()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.exports = src.exports || tgt.exports
    tgt.from = src.from || tgt.from
    tgt.default = typeof src.default !== 'undefined' ? src.default : tgt.default
    return tgt
  }
}

export class Role {
  key: string
  name: string
  rules: Rule[]

  constructor() {
    this.key = ''
    this.name = ''
    this.rules = []
  }

  reset() {
    this.key = ''
    this.name = ''
    this.rules = []
  }

  static copy(src: any, tgt?: Role): Role {
    tgt = tgt || new Role()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    if (src.rules) {
      tgt.rules.splice(0, tgt.rules.length)
      tgt.rules.push(
        ...src.rules.map((rule: any) => {
          return Rule.copy(typeof rule === 'string' ? { key: rule } : rule)
        })
      )
    }
    return tgt
  }
}

export class Auth {
  key: string
  model: string
  props: { key: string; name: string; alg: string }[]
  roles: Role[]
  apis: API[]

  constructor() {
    this.key = ''
    this.model = ''
    this.props = []
    this.roles = []
    this.apis = []
  }

  reset() {
    this.key = ''
    this.model = ''
    this.props = []
    this.roles = []
    this.apis = []
  }

  static copy(src: any, tgt?: Auth): Auth {
    tgt = tgt || new Auth()
    tgt.key = src.key || src._id || tgt.key
    tgt.model = src.model || tgt.model
    tgt.props = src.props || tgt.props
    tgt.roles = src.roles ? src.roles.map((role: any) => Role.copy(role)) : tgt.roles
    tgt.apis = src.apis ? src.apis.map((api: any) => API.copy(api)) : tgt.apis
    return tgt
  }
}

export const authValues = ['s', '*', '*/*']
export class Rule {
  key: string
  method: string
  path: string
  value: string
  action: string

  constructor() {
    this.key = ''
    this.method = 'GET'
    this.path = ''
    this.value = '*'
    this.action = ''
  }

  reset() {
    this.key = ''
    this.method = 'GET'
    this.path = ''
    this.value = '*'
    this.action = ''
  }

  static copy(src: any, tgt?: Rule): Rule {
    tgt = tgt || new Rule()
    tgt.key = src.key || src._id || tgt.key
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.value = src.value || tgt.value
    tgt.action = src.action || tgt.action
    return tgt
  }
}

export class Admin {
  key: string
  name: string
  password: string
  repeatPwd: string
  code: string
  mode: '登录' | '注册'

  constructor() {
    this.key = ''
    this.name = ''
    this.password = ''
    this.repeatPwd = ''
    this.code = ''
    this.mode = '登录'
  }

  static copy(src: any, tgt?: Admin): Admin {
    tgt = tgt || new Admin()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.password = src.password || tgt.password
    tgt.repeatPwd = src.repeatPwd || tgt.repeatPwd
    tgt.code = src.code || tgt.code
    tgt.mode = src.mode || tgt.mode
    return tgt
  }
}
