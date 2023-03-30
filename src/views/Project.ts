/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Mapper from '@lib/types/mapper'
import Transfer from '@/types/transfer'
import type { UploadChangeParam, UploadFile } from 'ant-design-vue'
import { Cond, methods } from '@lib/types'
import Column from '@lib/types/column'
import { EmitType, Method, emitTypeOpns, timeUnits } from '@/types/service'
import Property from '@/types/property'
import Service from '@/types/service'
import store from '@/store'
import { lytOpns, Page } from '@/types/frontend'
import Model from '@/types/model'

export const tsEmitter = new Emitter()

export const tsMapper = new Mapper({
  file: {
    label: '上传传送文件',
    type: 'UploadFile',
    onChange: (_record: Transfer, info: UploadChangeParam) => {
      tsEmitter.emit(
        'editable',
        info.fileList.reduce(
          (prev: boolean, curr: UploadFile) => prev && curr.status === 'done',
          true
        )
      )
    }
  },
  dest: {
    label: '投放位置',
    desc: '基于容器/app位置（注意：文件名不能修改，所以这里只能填写目录！）',
    type: 'Input'
  }
})

function genMdlPath(svc: Service): string {
  const model = (store.getters['project/models'] as Model[]).find(model => model.name === svc.model)
  if (!model) {
    return ''
  }
  const relProp = model.props.find((prop: Property) => prop.relative && prop.relative.model)
  switch (svc.method) {
    case 'LINK':
      return relProp ? `/mdl/v1/${svc.model}/:index/${relProp.name}/:propIdx` : ''
    case 'POST':
      return `/mdl/v1/${svc.model}`
    case 'DELETE':
    case 'PUT':
    case 'GET':
      return `/mdl/v1/${svc.model}/:index`
    default:
      return ''
  }
}

export const svcEmitter = new Emitter()

export const svcMapper = new Mapper({
  emit: {
    label: '激发类型',
    type: 'Select',
    options: emitTypeOpns,
    rules: [{ required: true, message: '必须选择一种激活方式！' }],
    onChange: (_svc: Service, to: EmitType) => {
      switch (to) {
        case 'api':
          svcEmitter.emit('update:mapper', {
            method: { rules: [{ required: true, message: '必须选择一种访问方式' }] },
            path: { rules: [{ required: true, message: '必须填入访问路由！' }] }
          })
          break
        case 'timeout':
        case 'interval':
          svcEmitter.emit('update:mapper', {
            method: { rules: [] },
            path: { rules: [] },
            cdValue: { rules: [{ required: true, message: '必须填入时间值！' }] },
            cdUnit: { rules: [{ required: true, message: '必须选择时间类型！' }] }
          })
          break
      }
    }
  },
  name: {
    label: '文件名',
    desc: '所在文件，可以直接选择为模型名',
    type: 'SelOrIpt',
    disabled: [
      Cond.copy({ key: 'model', cmp: '!=', val: '' }),
      Cond.copy({ key: 'model', cmp: '!=', val: undefined })
    ],
    rules: [{ required: true, message: '必须填入文件名！' }]
  },
  interface: {
    label: '方法',
    desc: '指定函数',
    type: 'Input',
    disabled: [
      Cond.copy({ key: 'model', cmp: '!=', val: '' }),
      Cond.copy({ key: 'model', cmp: '!=', val: undefined })
    ],
    rules: [{ required: true, message: '必须填入方法！' }]
  },
  model: {
    label: '模型路由',
    type: 'Select',
    allowClear: true,
    display: [Cond.copy({ key: 'emit', cmp: '=', val: 'api' })],
    disabled: [Cond.copy({ key: 'method', cmp: '=', val: 'LINK' })],
    onChange: (svcState: Service, to: string) => {
      if (to) {
        svcState.name = to
      }
    }
  },
  method: {
    label: '访问方式',
    type: 'Select',
    options: methods.map(mthd => ({
      label: mthd,
      value: mthd
    })),
    onChange: (svc: Service, to: Method) => {
      if (to === 'LINK') {
        svc.model = store.getters['model/ins'].name
      }
      if (svc.model) {
        svc.path = genMdlPath(svc)
      }
    },
    display: [Cond.copy({ key: 'emit', cmp: '=', val: 'api' })]
  },
  path: {
    label: '路由',
    type: 'Input',
    display: [Cond.copy({ key: 'emit', cmp: '=', val: 'api' })],
    disabled: [
      Cond.copy({ key: 'model', cmp: '!=', val: '' }),
      Cond.copy({ key: 'model', cmp: '!=', val: undefined })
    ],
    onChange: (svc: Service, path: string) => {
      if (!path.startsWith('/')) {
        svc.path = `/${path}`
      }
    }
  },
  needRet: {
    label: '是否返回',
    desc: '是否返回一个result，选择否则可以自定义返回体ctx.body = X',
    type: 'Checkbox',
    display: [Cond.copy({ key: 'emit', cmp: '=', val: 'api' })]
  },
  cdValue: {
    label: '触发值',
    desc: '指定时间间隔或时刻',
    type: 'Input',
    display: {
      OR: [
        Cond.copy({ key: 'emit', cmp: '==', val: 'timeout' }),
        Cond.copy({ key: 'emit', cmp: '==', val: 'interval' })
      ]
    }
  },
  cdUnit: {
    label: '触发值',
    desc: '指定时间间隔或时刻',
    type: 'Select',
    options: timeUnits,
    display: {
      OR: [
        Cond.copy({ key: 'emit', cmp: '=', val: 'timeout' }),
        Cond.copy({ key: 'emit', cmp: '=', val: 'interval' })
      ]
    }
  },
  desc: {
    label: '描述',
    type: 'Textarea'
  }
})

export const svcColumns = [
  new Column('激活方式', 'emit'),
  new Column('路由/激发条件', 'pathCond'),
  new Column('访问方式/控制', 'methodCtrl', { width: 120 }),
  new Column('文件/方法', 'fileFunc'),
  new Column('描述', 'desc'),
  new Column('流程', 'flow')
]

export const frontend = {
  expEmitter: new Emitter(),
  expMapper: new Mapper({
    name: {
      label: '名称',
      desc: '不能与所属项目同名！',
      type: 'Input'
    },
    pages: {
      label: '页面',
      type: 'Table',
      columns: [new Column('路由', 'path'), new Column('布局', 'layout')],
      mapper: new Mapper({
        path: {
          label: '路由',
          type: 'Input'
        },
        layout: {
          label: '布局',
          type: 'Select',
          options: lytOpns
        }
      }),
      copy: Page.copy
    },
    withLib: {
      label: '前端库',
      type: 'Checkbox'
    },
    modules: {
      label: '模组',
      type: 'EditList'
    }
  }),
  depEmitter: new Emitter()
}
