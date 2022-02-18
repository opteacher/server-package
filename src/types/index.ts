/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getProperty } from '@/utils'

export class Cond {
  key: string
  cmp?: '=' | '!=' | 'in'
  val: any

  constructor() {
    this.key = ''
    this.val = undefined
  }

  isValid(object: Record<string, any>) {
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
