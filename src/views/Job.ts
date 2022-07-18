import { OpnType } from '@/types'
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import { emitTypeOpns, timeUnits } from '@/types/service'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export const emitter = new Emitter()

export const columns = [
  new Column('文件名', 'name'),
  new Column('方法', 'interface'),
  new Column('路径', 'path'),
  new Column('激发类型', 'emit'),
  new Column('任务参数', 'condition'),
  new Column('流程', 'flow'),
  new Column('控制', 'ctrl')
]

export const mapper = new Mapper({
  name: {
    label: '文件名',
    desc: '所在文件，可以直接选择为模型名',
    type: 'SelOrIpt'
  },
  interface: {
    label: '方法',
    desc: '指定函数',
    type: 'Input'
  },
  path: {
    display: false
  },
  emit: {
    label: '激发类型',
    type: 'Select',
    options: emitTypeOpns.filter((opn: OpnType) => opn.value !== 'api' && opn.value !== 'none')
  },
  cdValue: {
    label: '触发值',
    desc: '指定时间间隔或时刻',
    type: 'Input'
  },
  cdUnit: {
    label: '触发值',
    desc: '指定时间间隔或时刻',
    type: 'Select',
    options: timeUnits
  }
})
