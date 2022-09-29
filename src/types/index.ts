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
  | 'Password'
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
  | 'CodeEditor'
  | 'EditList'
  | 'Group'
  | 'Carousel'
  | 'Row'
  | 'Col'
  | 'Card'
  | 'Image'
  | 'Unknown'

export const compoOpns = [
  { label: '文本框', value: 'Text' },
  { label: '块', value: 'Block' },
  { label: '输入框', value: 'Input' },
  { label: '密码框', value: 'Password' },
  { label: '数字框', value: 'Number' },
  { label: '按钮', value: 'Button' },
  { label: '选择框', value: 'Select' },
  { label: '日期选择', value: 'DateTime' },
  { label: '多选框', value: 'Checkbox' },
  { label: '单选框', value: 'Switch' },
  { label: '可编辑表', value: 'Table' },
  { label: '多行输入框', value: 'Textarea' },
  { label: '可删除', value: 'Delable' },
  { label: '可选可输入', value: 'SelOrIpt' },
  { label: '上传', value: 'Upload' },
  { label: '层级选择框', value: 'Cascader' },
  { label: '列表选择框', value: 'ListSelect' },
  { label: '代码编辑框', value: 'CodeEditor' },
  { label: '可编辑列表', value: 'EditList' },
  { label: '滚动展示框', value: 'Carousel' },
  { label: '横向容器', value: 'Row' },
  { label: '纵向容器', value: 'Col' },
  { label: '卡片', value: 'Card' },
  { label: '图片', value: 'Image' },
  { label: '未知', value: 'Unknown' }
]

export const cmpLblMap = {
  Text: '文本框',
  Block: '块',
  Input: '输入框',
  Password: '密码框',
  Number: '数字框',
  Button: '按钮',
  Select: '选择框',
  DateTime: '日期选择',
  Checkbox: '多选框',
  Switch: '单选框',
  Table: '可编辑表',
  Textarea: '多行输入框',
  Delable: '可删除',
  SelOrIpt: '可选可输入',
  Upload: '上传',
  Cascader: '层级选择框',
  ListSelect: '列表选择框',
  CodeEditor: '代码编辑框',
  EditList: '可编辑列表',
  Carousel: '滚动展示框',
  Row: '横向容器',
  Col: '纵向容器',
  Card: '卡片',
  Image: '图片',
  Unknown: '未知'
} as Record<string, string>

export type OpnType = {
  label: string
  subLabel?: string
  value: any
  children?: any[]
}

export type CmpRel = 'AND' | 'OR'

export const baseTypes = [
  'Unknown',
  'Id',
  'String',
  'LongStr',
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
  | 'Id'
  | 'Number'
  | 'String'
  | 'LongStr'
  | 'Boolean'
  | 'DateTime'
  | 'Array'
  | 'Object'
  | 'Any'
