/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TinyEmitter as Emitter } from 'tiny-emitter'
import _ from 'lodash'
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import { Cond, methods } from '@/types'
import Service, { emitTypeOpns } from '@/types/service'
import Deploy from '@/types/deploy'
import Transfer from '@/types/transfer'

export const svcEmitter = new Emitter()

export const ServiceColumns = [
  new Column('激活方式', 'emit'),
  new Column('模型路由', 'isModel'),
  new Column('访问方式', 'method'),
  new Column('路径', 'path'),
  new Column('服务', 'name'),
  new Column('接口', 'interface'),
  new Column('任务参数', 'emitCond'),
  new Column('流程', 'flow'),
  new Column('控制', 'ctrl')
]

export const ServiceMapper = new Mapper({
  emit: {
    type: 'Select',
    options: emitTypeOpns,
    onChange: (svc: Service, to: string) => {
      switch (to) {
        case 'timeout':
        case 'interval':
          svc.method = ''
          svc.path = `/job/v1/${svc.model}`
          break
        case 'api':
          svc.cdUnit = 's'
          svc.cdValue = 1
          svc.emitCond = ''
          svc.path = ''
          break
        default:
          svc.method = ''
          svc.path = ''
          svc.cdUnit = 's'
          svc.cdValue = 1
          svc.emitCond = ''
      }
    }
  },
  isModel: {
    type: 'Switch',
    onChange: (svc: Service, to: boolean) => {
      if (to) {
        svc.path = genMdlPath(svc)
      }
    },
    display: [Cond.copy({ key: 'emit', cmp: '==', val: 'api' })]
  },
  method: {
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
    type: 'Input',
    display: [Cond.copy({ key: 'emit', cmp: '==', val: 'api' })],
    disabled: [Cond.copy({ key: 'isModel', cmp: '==', val: true })],
    onChange: (svc: Service, path: string) => {
      if (!path.startsWith('/')) {
        svc.path = `/${path}`
      }
    }
  },
  emitCond: {
    display: {
      OR: [
        Cond.copy({ key: 'emit', cmp: '==', val: 'timeout' }),
        Cond.copy({ key: 'emit', cmp: '==', val: 'interval' })
      ]
    }
  },
  name: {
    type: 'SelOrIpt'
  },
  interface: {
    type: 'Input'
  },
  flow: {},
  ctrl: {}
})

export const timeUnits = [
  {
    label: '毫秒',
    value: 'ms'
  },
  {
    label: '秒',
    value: 's'
  },
  {
    label: '分钟',
    value: 'm'
  },
  {
    label: '小时',
    value: 'h'
  },
  {
    label: '天',
    value: 'D'
  },
  {
    label: '周',
    value: 'W'
  },
  {
    label: '月',
    value: 'M'
  },
  {
    label: '年',
    value: 'Y'
  }
]

export function genMdlPath(svc: Service): string {
  switch (svc.method) {
    case 'POST':
      return `/mdl/v1/${svc.model}`
    case 'DELETE':
    case 'PUT':
    case 'GET':
      return `/mdl/v1/${svc.model}/:index`
    case 'ALL':
      return `/mdl/v1/${svc.model}s`
    default:
      return ''
  }
}

export class DeployForm {
  show: boolean
  mapper: Mapper

  constructor() {
    this.show = false
    this.mapper = new Mapper({
      gitURL: {
        label: '前端仓库URL',
        desc: 'git clone后的URL',
        type: 'Input',
        rules: [],
        onChange: (record: Deploy, to: string) => {
          if (to) {
            const nameSfx = to.split('/').pop()
            record.name = nameSfx?.substring(0, nameSfx.lastIndexOf('.')) as string
          }
        }
      },
      name: {
        label: '前端名',
        type: 'Input',
        disabled: true
      },
      buildCmd: {
        label: '构建命令',
        desc: '生成前端首页和相关资源的命令',
        type: 'Input'
      },
      indexPath: {
        label: '首页生成目录',
        desc: '生成之后的首页的位置，【Vue】vue.config的outputDir',
        type: 'Input',
        rules: []
      },
      assetsPath: {
        label: '资源生成目录',
        desc: '生成之后的前端资源的位置，【Vue】vue.config的outputDir + assetsDir',
        type: 'Input'
      }
    })
  }
}

export const tsEmitter = new Emitter()

export const tsMapper = new Mapper({
  file: {
    label: '上传传送文件',
    type: 'Upload',
    onChange: (_record: Transfer, info: any) => {
      for (const file of info.fileList) {
        if (file.status !== 'done') {
          tsEmitter.emit('editable', false)
          return
        }
      }
      tsEmitter.emit('editable', true)
    }
  },
  dest: {
    label: '投放位置',
    desc: '基于容器/app位置（注意：文件名不能修改，所以这里只能填写目录！）',
    type: 'Input'
  }
})
