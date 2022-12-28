import { bsTpOpns, compoOpns } from '@/types'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'

export const columns = [
  new Column('组件名', 'name'),
  new Column('绑定类型', 'ctype'),
  new Column('类别', 'category')
]

export const mapper = new Mapper({
  name: {
    label: '组件名',
    type: 'Select',
    options: compoOpns
  },
  ctype: {
    label: '绑定类型',
    type: 'Select',
    options: bsTpOpns
  },
  category: {
    label: '类别',
    type: 'Select',
    options: [
      { label: '表单项', value: 'field' },
      { label: '展示', value: 'display' },
      { label: '容器', value: 'container' }
    ]
  },
  props: {
    expanded: true,
    display: false
  }
})

export const fldColumns = [
  new Column('标签', 'label'),
  new Column('类型', 'ftype'),
  new Column('占位提示', 'placeholder'),
  new Column('关联分量', 'refer')
]

export const fldMapper = new Mapper({
  label: {
    label: '标签',
    type: 'Input'
  },
  ftype: {
    label: '类型',
    type: 'Select',
    options: compoOpns
  },
  placeholder: {
    label: '占位提示',
    type: 'Input'
  },
  refer: {
    label: '关联分量',
    type: 'Input'
  }
})
