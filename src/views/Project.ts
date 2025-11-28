/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import store from '@/store'
import Dep from '@/types/dep'
import { Page } from '@/types/frontend'
import Model from '@/types/model'
import Property from '@/types/property'
import { EmitType, Method, emitTypeOpns } from '@/types/service'
import Service from '@/types/service'
import Transfer from '@/types/transfer'
import Variable from '@/types/variable'
import { depExp, setProp, updDftByType } from '@/utils'
import { Cond, OpnType, typeOpns, methods, BaseTypes } from '@lib/types'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { type UploadChangeParam, type UploadFile } from 'ant-design-vue'
import { TinyEmitter as Emitter, TinyEmitter } from 'tiny-emitter'

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
    placeholder: '基于容器/app位置（注意：文件名不能修改，所以这里只能填写目录！）',
    type: 'Input'
  }
})

function genMdlPath(svc: Service): string {
  const model = (store.getters['project/models'] as Model[]).find(model => model.key === svc.model)
  if (!model) {
    return ''
  }
  const relProp = model.props.find((prop: Property) => prop.relative && prop.relative.model)
  switch (svc.method) {
    case 'LINK':
      return relProp ? `/mdl/v1/${model.name}/:index/${relProp.name}/:propIdx` : ''
    case 'POST':
      return `/mdl/v1/${model.name}`
    case 'DELETE':
    case 'PUT':
    case 'GET':
      return `/mdl/v1/${model.name}/:index`
    default:
      return ''
  }
}

export const svcEmitter = new Emitter()

export const varEmitter = new Emitter()

export const varMapper = new Mapper({
  name: {
    label: '参数名',
    type: 'Input'
  },
  vtype: {
    label: '类型',
    type: 'Select',
    options: typeOpns,
    onChange: (_var: Variable, to: BaseTypes) => updDftByType(to, varEmitter)
  },
  dftVal: {
    label: '默认值',
    type: 'Input'
  },
  remark: {
    label: '备注',
    type: 'Textarea'
  }
})

export const svcMapper = new Mapper({
  emit: {
    label: '激发类型',
    type: 'Select',
    options: emitTypeOpns,
    rules: [{ required: true, message: '必须选择一种激活方式！' }],
    onChange: (_svc: Service, to: EmitType) => {
      switch (to) {
        case 'api':
          svcEmitter.emit('update:mprop', {
            'method.rules': [{ required: true, message: '必须选择一种访问方式' }],
            'path.rule': [{ required: true, message: '必须填入访问路由！' }]
          })
          break
        case 'timeout':
        case 'interval':
          svcEmitter.emit('update:mprop', {
            'method.rules': [],
            'path.rules': []
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
      new Cond({ prop: 'model', compare: '!=', value: '' }),
      new Cond({ prop: 'model', compare: '!=', value: undefined })
    ],
    rules: [{ required: true, message: '必须填入文件名！' }]
  },
  interface: {
    label: '方法',
    desc: '指定函数，不可使用关键字：import',
    type: 'Input',
    disabled: [
      new Cond({ prop: 'model', compare: '!=', value: '' }),
      new Cond({ prop: 'model', compare: '!=', value: undefined })
    ],
    rules: [{ required: true, message: '必须填入方法！' }]
  },
  model: {
    label: '模型路由',
    type: 'Select',
    allowClear: true,
    display: [new Cond({ prop: 'emit', compare: '==', value: 'api' })],
    disabled: [new Cond({ prop: 'method', compare: '==', value: 'LINK' })],
    onChange: (svcState: Service, to: string) => {
      if (to) {
        svcState.name = (svcMapper['model'].options as OpnType[]).find(
          (opn: OpnType) => opn.value === to
        )?.label as string
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
        svc.model = store.getters['model/ins'].key
      }
      if (svc.model) {
        svc.path = genMdlPath(svc)
      }
    },
    display: [new Cond({ prop: 'emit', compare: '==', value: 'api' })]
  },
  path: {
    label: '路由',
    type: 'Input',
    display: [new Cond({ prop: 'emit', compare: '==', value: 'api' })],
    disabled: [
      new Cond({ prop: 'model', compare: '!=', value: '' }),
      new Cond({ prop: 'model', compare: '!=', value: undefined })
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
    display: [new Cond({ prop: 'emit', compare: '==', value: 'api' })]
  },
  condition: {
    label: '延时/定时条件',
    type: 'Unknown',
    display: {
      OR: [
        new Cond({ prop: 'emit', compare: '==', value: 'timeout' }),
        new Cond({ prop: 'emit', compare: '==', value: 'interval' })
      ]
    }
  },
  deps: {
    label: '依赖',
    type: 'TagList',
    subProp: 'subTitle',
    flatItem: true,
    mapper: new Mapper({
      data: {
        type: 'ListSelect',
        height: 300,
        options: []
      }
    }),
    emitter: new TinyEmitter(),
    newFun: () => ({ data: [] }),
    onSaved: (form: any) => form,
    onAdded: (form: any, data: any) => setProp(form, 'data', data)
  },
  stcVars: {
    label: '全局变量',
    type: 'Table',
    desc: '会定义在文件中，所以同一文件只能定义相同的变量名，该变量也会出现在流程设计中局部变量选择中',
    emitter: varEmitter,
    columns: [
      new Column('参数名', 'name'),
      new Column('参数类型', 'vtype'),
      new Column('初始值', 'dftVal'),
      new Column('备注', 'remark')
    ],
    mapper: varMapper,
    newFun: () => new Variable(),
    onSaved: (src: Variable, vars: Variable[]) => {
      const tgt = vars.find(v => v.key === src.key)
      if (src.key && tgt) {
        Variable.copy(src, tgt)
      } else {
        vars.push(Variable.copy(src))
      }
    },
    onDeleted: (key: any, vars: Variable[]) => {
      vars.splice(
        vars.findIndex(v => v.key === key),
        1
      )
    },
    addable: true,
    delable: true
  },
  desc: {
    label: '描述',
    type: 'Textarea'
  }
})

svcEmitter.on('show', () => {
  const deps = store.getters['project/deps']
  svcEmitter.emit('update:mprop', {
    'deps.lblMapper': Object.fromEntries(deps.map((dep: Dep) => [dep.key, dep.name])),
    'deps.mapper.data.options': deps.map((dep: Dep) => ({
      key: dep.key,
      title: dep.name,
      subTitle: `import ${depExp(dep)} from '${dep.from}'`
    }))
  })
})

export const svcColumns = [
  new Column('激活方式', 'emit'),
  new Column('路由/激发条件', 'pathCond'),
  new Column('访问方式/控制', 'methodCtrl', { width: 100 }),
  new Column('文件/方法', 'fileFunc'),
  new Column('全局变量', 'stcVars'),
  new Column('描述', 'desc')
]

export const frtEmitter = new Emitter()

export const frtMapper = new Mapper({
  backend: {
    label: '绑定后台',
    type: 'Select'
  },
  pages: {
    label: '页面',
    type: 'EditList',
    lblProp: 'path',
    inline: false,
    mapper: {
      path: {
        label: '路由',
        type: 'Input'
      },
      layout: {
        label: '布局',
        type: 'Unknown'
      }
    },
    copy: Page.copy
  }
})
