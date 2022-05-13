/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CompoType, Cond, OpnType } from '.'
import Column from './column'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export class BaseMapper {
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

export class iptMapper extends BaseMapper {
  iptType: string
  prefix: string
  suffix: string

  constructor() {
    super()
    this.iptType = ''
    this.prefix = ''
    this.suffix = ''
  }

  static copy(src: any, tgt?: iptMapper): iptMapper {
    tgt = tgt || new iptMapper()
    BaseMapper.copy(src, tgt)
    tgt.iptType = src.iptType || tgt.iptType
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
  addMod: boolean
  mode: 'select' | 'input'
  options: OpnType[]

  constructor() {
    super()
    this.addMod = false
    this.mode = 'input'
    this.options = []
  }

  static copy(src: any, tgt?: EditListMapper): EditListMapper {
    tgt = tgt || new EditListMapper()
    BaseMapper.copy(src, tgt)
    if (src.addMod) {
      tgt.addMod = src.addMod || tgt.addMod
    }
    tgt.mode = src.mode || tgt.mode
    tgt.options = src.options || tgt.options
    return tgt
  }
}

const EleTypeCopies = {
  Unknown: BaseMapper.copy,
  Input: iptMapper.copy,
  Number: iptMapper.copy,
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

export default class Mapper {
  [prop: string]: BaseMapper & Record<string, any>

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
