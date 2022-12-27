import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'

export const columns = [
  new Column('名称', 'name'),
  new Column('导出', 'exports'),
  new Column('导入', 'from'),
  new Column('默认导出', 'default'),
  new Column('版本', 'version')
]

export const mapper = new Mapper({
  name: {
    label: '名称',
    type: 'Input'
  },
  exports: {
    label: '导出',
    type: 'EditList'
  },
  from: {
    label: '导入',
    type: 'Input',
    desc: "import * from '出现在这里'"
  },
  default: {
    label: '默认导出',
    type: 'Checkbox',
    desc: "[true]: import exports[0] from ''; [false]: import { ..exports } from ''"
  },
  version: {
    label: '版本',
    type: 'Input'
  }
})
