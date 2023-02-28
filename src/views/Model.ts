/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTypes, baseTypes, Cond } from '@/types/index'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import Property from '@/types/property'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export const columns = [
  new Column('模型名', 'name'),
  new Column('标签', 'label'),
  new Column('描述', 'desc'),
  new Column('记录时间', 'logTime')
]

export const mapper = new Mapper({
  name: {
    label: '模型名',
    type: 'Input',
    rules: [{ required: true, message: '请输入模型名！', trigger: 'blur' }]
  },
  label: {
    label: '标签',
    type: 'Input'
  },
  desc: {
    label: '描述',
    type: 'Input'
  },
  logTime: {
    label: '记录操作时间',
    type: 'Checkbox'
  }
})

export const expMapper = new Mapper({
  name: {
    label: '类名',
    type: 'Input'
  },
  expType: {
    label: '导出类型',
    type: 'Select',
    options: ['typescript', 'javascript'].map(opn => ({
      label: opn,
      value: opn
    }))
  },
  genCopy: {
    label: '生成复制函数',
    type: 'Checkbox'
  },
  genReset: {
    label: '生成重置函数',
    type: 'Checkbox'
  }
})

export const propEmitter = new Emitter()

export const propColumns = [
  new Column('字段名', 'name'),
  new Column('标签', 'label'),
  new Column('字段类型', 'ptype'),
  new Column('是否为索引', 'index'),
  new Column('是否唯一', 'unique'),
  new Column('默认值', 'default'),
  new Column('关联模型', 'relative'),
  new Column('备注', 'remark', { width: 300 })
]

const dftMapper = {
  LongStr: { type: 'Textarea' },
  Object: {
    type: 'CodeEditor',
    lang: 'json'
  },
  Array: { type: 'EditList' },
  Boolean: {
    type: 'Select',
    options: [
      { label: 'TRUE', value: 'true' },
      { label: 'FALSE', value: 'false' }
    ]
  },
  DateTime: { type: 'DateTime' },
  Number: { type: 'Number' },
  String: { type: 'Input' }
} as Record<BaseTypes, any>

export const propMapper = new Mapper({
  name: {
    label: '字段名',
    type: 'Input',
    desc: '不可取名：offset、limit！',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    rules: [{ required: true, message: '请输入字段名！', trigger: 'blur' }]
  },
  label: {
    label: '标签',
    type: 'Input',
    rules: [{ required: true, message: '请输入标签！', trigger: 'blur' }]
  },
  ptype: {
    label: '字段类型',
    type: 'Select',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    options: baseTypes.map(bsTyp => ({
      label: bsTyp,
      value: bsTyp
    })),
    rules: [{ required: true, message: '请选择字段类型！', trigger: 'change' }],
    onChange: (_prop: Property, toType: BaseTypes) => {
      propEmitter.emit('update:mapper', { default: dftMapper[toType as BaseTypes] })
      propEmitter.emit('update:data', { default: toType === 'Array' ? [] : null })
    }
  },
  index: {
    label: '是否为索引',
    type: 'Checkbox',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    placeholder: '索引可加速查找记录，但样本空间必须够大'
  },
  unique: {
    label: '是否唯一',
    type: 'Checkbox',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    placeholder: '重复的记录无法持久化'
  },
  default: {
    label: '默认值',
    type: 'Input'
  },
  relative: {
    label: '关联模型',
    type: 'Unknown'
  },
  remark: {
    label: '备注',
    type: 'Textarea'
  }
})
