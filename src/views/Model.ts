/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseTypes } from '@/types/index'
import Column from '@/types/column'
import Mapper from '@/types/mapper'

export const columns = [
  new Column('模型名', 'name'),
  new Column('描述', 'desc'),
  new Column('记录时间', 'logTime')
]

export const mapper = new Mapper({
  name: {
    label: '模型名',
    type: 'Input',
    rules: [{ required: true, message: '请输入模型名！', trigger: 'blur' }]
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

export const propColumns = [
  new Column('字段名', 'name'),
  new Column('标签', 'label'),
  new Column('字段类型', 'ptype'),
  new Column('是否为索引', 'index'),
  new Column('是否唯一', 'unique'),
  new Column('是否可访问', 'visible'),
  new Column('备注', 'remark')
]

export const propMapper = new Mapper({
  name: {
    label: '字段名',
    type: 'Input',
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
    options: baseTypes.map(bsTyp => ({
      label: bsTyp,
      value: bsTyp
    })),
    rules: [{ required: true, message: '请选择字段类型！', trigger: 'change' }]
  },
  index: {
    label: '是否为索引',
    type: 'Checkbox'
  },
  unique: {
    label: '是否唯一',
    type: 'Checkbox'
  },
  visible: {
    label: '是否可访问',
    type: 'Checkbox'
  },
  remark: {
    label: '备注',
    type: 'Input'
  }
})

export const svcColumns = [
  new Column('激活方式', 'emit'),
  new Column('访问方式', 'method'),
  new Column('路由/激发条件', 'pathCond'),
  new Column('详细', 'detail')
]