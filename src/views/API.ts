import { Cond, methods } from '@/types'
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import Service from '@/types/service'
import { genMdlPath } from '@/utils'

export const columns = [
  new Column('模型路由', 'isModel'),
  new Column('访问方式', 'method'),
  new Column('路径', 'path'),
  new Column('服务', 'name'),
  new Column('接口', 'interface'),
  new Column('流程', 'flow')
]

export const mapper = new Mapper({
  name: {
    label: '名称',
    desc: '所在文件，可以直接选择为模型名',
    type: 'SelOrIpt'
  },
  interface: {
    label: '方法',
    desc: '指定函数',
    type: 'Input'
  },
  isModel: {
    label: '是否为模型路由',
    type: 'Checkbox',
    onChange: (svc: Service, to: boolean) => {
      if (to) {
        svc.path = genMdlPath(svc)
      }
    },
    display: [Cond.copy({ key: 'emit', cmp: '==', val: 'api' })]
  },
  method: {
    label: '访问方式',
    type: 'Select',
    options: methods.map(mthd => ({
      label: mthd,
      value: mthd
    })),
    onChange: (svc: Service) => {
      if (svc.isModel) {
        svc.path = genMdlPath(svc)
      }
    },
    display: [Cond.copy({ key: 'emit', cmp: '==', val: 'api' })]
  },
  path: {
    label: '路由',
    type: 'Input',
    display: [Cond.copy({ key: 'emit', cmp: '==', val: 'api' })],
    disabled: [Cond.copy({ key: 'isModel', cmp: '==', val: true })],
    onChange: (svc: Service, path: string) => {
      if (!path.startsWith('/')) {
        svc.path = `/${path}`
      }
    }
  }
})
