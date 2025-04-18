/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { depAPI, typAPI } from '@/apis'
import router from '@/router'
import store from '@/store'
import Dep from '@/types/dep'
import { Page } from '@/types/frontend'
import Model from '@/types/model'
import Project from '@/types/project'
import Property from '@/types/property'
import { EmitType, Method, emitTypeOpns } from '@/types/service'
import Service from '@/types/service'
import Transfer from '@/types/transfer'
import Typo, { Func } from '@/types/typo'
import Variable from '@/types/variable'
import { depExp, pickOrIgnore, setProp, updDftByType } from '@/utils'
import { Cond, OpnType, typeOpns, methods, BaseTypes } from '@lib/types'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { Modal, type UploadChangeParam, type UploadFile } from 'ant-design-vue'
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
      new Cond({ key: 'model', cmp: '!=', val: '' }),
      new Cond({ key: 'model', cmp: '!=', val: undefined })
    ],
    rules: [{ required: true, message: '必须填入文件名！' }]
  },
  interface: {
    label: '方法',
    desc: '指定函数，不可使用关键字：import',
    type: 'Input',
    disabled: [
      new Cond({ key: 'model', cmp: '!=', val: '' }),
      new Cond({ key: 'model', cmp: '!=', val: undefined })
    ],
    rules: [{ required: true, message: '必须填入方法！' }]
  },
  model: {
    label: '模型路由',
    type: 'Select',
    allowClear: true,
    display: [new Cond({ key: 'emit', cmp: '=', val: 'api' })],
    disabled: [new Cond({ key: 'method', cmp: '=', val: 'LINK' })],
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
    display: [new Cond({ key: 'emit', cmp: '=', val: 'api' })]
  },
  path: {
    label: '路由',
    type: 'Input',
    display: [new Cond({ key: 'emit', cmp: '=', val: 'api' })],
    disabled: [
      new Cond({ key: 'model', cmp: '!=', val: '' }),
      new Cond({ key: 'model', cmp: '!=', val: undefined })
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
    display: [new Cond({ key: 'emit', cmp: '=', val: 'api' })]
  },
  condition: {
    label: '延时/定时条件',
    type: 'Unknown',
    display: {
      OR: [
        new Cond({ key: 'emit', cmp: '=', val: 'timeout' }),
        new Cond({ key: 'emit', cmp: '=', val: 'interval' })
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

export const clsPrpCols = [
  new Column('字段名', 'name'),
  new Column('标签', 'label'),
  new Column('类型', 'ptype'),
  new Column('默认值', 'dftVal'),
  new Column('构造导入', 'index'),
  new Column('备注', 'remark')
]

function genVarMapper(emitter: Emitter, prefix = '') {
  return new Mapper({
    name: {
      label: '名称',
      type: 'Input',
      rules: [{ required: true, message: '必须填写名称！' }]
    },
    label: {
      label: '标签',
      type: 'Input'
    },
    ptype: {
      label: '类型',
      type: 'Select',
      rules: [{ required: true, message: '必须选择类型！' }],
      options: typeOpns.filter(({ value }) => value !== 'Id' && value !== 'Unknown'),
      onChange: (prop: Property) => updDftByType(prop.ptype, emitter, { prefix })
    },
    dftVal: {
      label: '默认值',
      type: 'Unknown'
    },
    index: {
      label: '构造导入',
      type: 'Checkbox',
      placeholder: '为真则表示该字段通过构造函数的参数初始化'
    },
    remark: {
      label: '备注',
      type: 'Textarea'
    }
  })
}

export const clsPrpEmitter = new Emitter()

clsPrpEmitter.on('show', (prop: Property) =>
  updDftByType(prop.ptype, clsPrpEmitter, pickOrIgnore(prop, ['dftVal'], false))
)

export const clsPrpMapper = genVarMapper(clsPrpEmitter)

export const clsFunCols = [
  new Column('函数名', 'name'),
  new Column('简介', 'label'),
  new Column('参数', 'args'),
  new Column('Async', 'isAsync'),
  new Column('备注', 'remark')
]

export const clsFunEmitter = new Emitter()

export const clsFunMapper = new Mapper({
  name: {
    label: '函数名',
    type: 'Input',
    rules: [{ required: true, message: '必须给出函数名！' }]
  },
  label: {
    label: '简介',
    type: 'Input'
  },
  args: {
    label: '参数',
    type: 'EditList',
    mapper: genVarMapper(clsFunEmitter, 'args.mapper.'),
    inline: false,
    flatItem: false,
    lblProp: 'name',
    subProp: 'label',
    onAdded: () => updDftByType('String', clsFunEmitter, { prefix: 'args.mapper.' })
  },
  isAsync: {
    label: 'Async前缀',
    type: 'Checkbox'
  },
  isStatic: {
    label: '静态函数',
    type: 'Checkbox'
  },
  remark: {
    label: '备注',
    type: 'Textarea'
  },
  design: {
    label: '流程',
    type: 'Button',
    inner: '流程设计',
    display: [new Cond({ key: 'key', cmp: '!=', val: '' })],
    onClick: (func: Func) => {
      const project = store.getters['project/ins'] as Project
      const typo = project.typos.find(typo => typo.funcs.find(fun => fun.key === func.key)) as Typo
      router.push(`/project/${project.key}/typo/${typo.key}/func/${func.key}`)
    }
  }
})

export const clsColumns = [
  new Column('类名', 'name'),
  new Column('类标签', 'label'),
  new Column('描述', 'desc')
]

export const clsMapper = new Mapper({
  name: {
    label: '类名',
    type: 'Input',
    rules: [{ required: true, message: '必须给出类名！' }]
  },
  label: {
    label: '类标签',
    type: 'Input'
  },
  desc: {
    label: '描述',
    type: 'Textarea'
  },
  super: {
    label: '父类',
    type: 'Select',
    options: []
  },
  params: {
    label: '构造参数',
    type: 'EditList',
    flatItem: true,
    mapper: new Mapper({
      pname: {
        type: 'Input',
        placeholder: '填入参数名'
      }
    }),
    newFun: () => ({ pname: '' })
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
  props: {
    label: '字段',
    type: 'Table',
    columns: clsPrpCols,
    mapper: clsPrpMapper,
    emitter: clsPrpEmitter,
    newFun: () => new Property()
  },
  funcs: {
    label: '方法',
    type: 'Table',
    columns: clsFunCols,
    mapper: clsFunMapper,
    emitter: clsFunEmitter,
    newFun: () => new Func()
  },
  opera: {
    label: '操作',
    type: 'Button',
    inner: '删除',
    danger: true,
    display: [new Cond({ key: 'key', cmp: '!=', val: '' })],
    onClick: (typo: Typo) => {
      Modal.confirm({
        title: '确定删除适配器',
        content: 'abcd',
        onOk: async () => {
          await typAPI.remove(typo)
          clsEmitter.emit('update:visible', false)
          await store.dispatch('project/refresh')
        }
      })
    }
  }
})

export const clsEmitter = new Emitter()

clsEmitter.on('show', () => {
  const deps = store.getters['project/deps']
  clsEmitter.emit('update:mprop', {
    'super.options': deps.map(({ key, name }) => ({
      label: name,
      value: key
    })),
    'deps.lblMapper': Object.fromEntries(deps.map((dep: Dep) => [dep.key, dep.name])),
    'deps.mapper.data.options': deps.map((dep: Dep) => ({
      key: dep.key,
      title: dep.name,
      subTitle: `import ${depExp(dep)} from '${dep.from}'`
    }))
  })
})
