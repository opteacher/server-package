import Column from '@/types/column'
import Mapper from '@/types/mapper'
import { emitTypeOpns, timeUnits } from '@/types/service'

export const columns = [
  new Column('文件名', 'name'),
  new Column('方法', 'interface'),
  new Column('激发类型', 'emit'),
  new Column('任务参数', 'emitCond'),
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
  emit: {
    label: '激发类型',
    type: 'Select',
    options: emitTypeOpns.filter((opn: any) => opn.value !== 'api' && opn.value !== 'none')
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
