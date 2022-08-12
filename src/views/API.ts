import store from '@/store'
import { Cond, methods } from '@/types'
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import Service from '@/types/service'
import { genMdlPath } from '@/utils'

export const columns = [
  new Column('模型路由', 'isModel'),
  new Column('访问方式', 'method'),
  new Column('路径', 'path'),
  new Column('文件名', 'name'),
  new Column('方法', 'interface'),
  new Column('流程', 'flow'),
  new Column('是否返回', 'needRet')
]

export const mapper = new Mapper({
  name: {
    label: '文件名',
    desc: '所在文件，可以直接选择为模型名',
    type: 'SelOrIpt',
    disabled: [Cond.copy({ key: 'isModel', cmp: '==', val: true })]
  },
  interface: {
    label: '方法',
    desc: '指定函数',
    type: 'Input',
    disabled: [Cond.copy({ key: 'isModel', cmp: '==', val: true })]
  },
  isModel: {
    label: '是否为模型路由',
    type: 'Checkbox',
    onChange: (svc: Service, to: boolean) => {
      if (to) {
        svc.name = store.getters['model/ins'].name
        svc.interface = ''
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
  },
  needRet: {
    label: '是否返回',
    desc: '是否返回一个result，选择否则可以自定义返回体ctx.body = X',
    type: 'Checkbox'
  }
})
