import dayjs from 'dayjs'
import { CompoType } from '.'
import Compo from '@lib/types/compo'
import Field from '@lib/types/field'

function defaultValue(ctype: CompoType) {
  switch (ctype) {
    case 'Number':
      return 0
    case 'DateTime':
      return dayjs()
    case 'Checkbox':
    case 'Switch':
      return false
    case 'Table':
    case 'UploadFile':
    case 'Cascader':
    case 'ListSelect':
    case 'EditList':
      return []
    case 'Input':
    case 'Password':
    case 'Select':
    case 'Textarea':
    case 'Delable':
    case 'SelOrIpt':
    case 'CodeEditor':
    default:
      return ''
  }
}

export default class CmpIns {
  key: string
  ctype: CompoType
  style: {
    width: string
    height: string
    padding: [string, string, string, string]
  } & Record<string, any>
  extra: any
  parent: CmpIns | null
  children: CmpIns[]

  constructor(compo?: Compo, key?: string) {
    this.key = key || ''
    this.ctype = compo ? (compo.name as CompoType) : 'Unknown'
    this.style = {
      width: 'auto',
      height: 'auto',
      padding: ['auto', 'auto', 'auto', 'auto']
    }
    this.extra = compo ? Object.fromEntries(
      (compo.props || []).map((item: Field) => [item.refer, defaultValue(item.ftype)])
    ) : {}
    this.parent = null
    this.children = []
  }

  reset() {
    this.key = ''
    this.ctype = 'Unknown'
    this.style.width = 'auto'
    this.style.height = 'auto'
    this.style.padding[0] = 'auto'
    this.style.padding[1] = 'auto'
    this.style.padding[2] = 'auto'
    this.style.padding[3] = 'auto'
    this.extra = {}
    this.parent = null
    this.children = []
  }

  static copy(src: any, tgt?: CmpIns, force = false): CmpIns {
    tgt = tgt || new CmpIns()
    tgt.key = force ? src.key || src._id : src.key || src._id || tgt.key
    tgt.ctype = force ? src.ctype : src.ctype || tgt.ctype
    if (src.style) {
      tgt.style.width = force ? src.style.width : src.style.width || tgt.style.width
      tgt.style.height = force ? src.style.height : src.style.height || tgt.style.height
      tgt.style.padding = force ? src.style.padding : src.style.padding || tgt.style.padding
    }
    tgt.extra = force ? src.extra : src.extra || tgt.extra
    tgt.parent = src.parent || (force ? null : tgt.parent)
    tgt.children = (src.children || (force ? [] : tgt.children)).map((cmpIns: any) =>
      CmpIns.copy(Object.assign(cmpIns, { parent: tgt }))
    )
    return tgt
  }
}
