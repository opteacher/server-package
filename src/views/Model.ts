/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseTypes, Cond, methods } from '@/types/index'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import Property from '@/types/property'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Service, { Method, emitTypeOpns, timeUnits } from '@/types/service'
import store from '@/store'
import { genMdlPath } from '@/utils'

export const columns = [
  new Column('模型名', 'name'),
  new Column('标签', 'label'),
  new Column('描述', 'desc'),
  new Column('记录时间', 'logTime')
]

export const mapper = new Mapper({
  name: {
    label: '模型名',
    type: 'Input',
    rules: [{ required: true, message: '请输入模型名！', trigger: 'blur' }]
  },
  label: {
    label: '标签',
    type: 'Input'
  },
  desc: {
    label: '描述',
    type: 'Input'
  },
  logTime: {
    label: '记录操作时间',
    type: 'Checkbox'
  }
})

export const expMapper = new Mapper({
  name: {
    label: '类名',
    type: 'Input'
  },
  expType: {
    label: '导出类型',
    type: 'Select',
    options: ['typescript', 'javascript'].map(opn => ({
      label: opn,
      value: opn
    }))
  },
  genCopy: {
    label: '生成复制函数',
    type: 'Checkbox'
  },
  genReset: {
    label: '生成重置函数',
    type: 'Checkbox'
  }
})

export const propEmitter = new Emitter()

export const propColumns = [
  new Column('字段名', 'name'),
  new Column('标签', 'label'),
  new Column('字段类型', 'ptype'),
  new Column('是否为索引', 'index'),
  new Column('是否唯一', 'unique'),
  new Column('默认值', 'default'),
  new Column('关联模型', 'relative'),
  new Column('备注', 'remark', { width: 300 })
]

export const propMapper = new Mapper({
  name: {
    label: '字段名',
    type: 'Input',
    desc: '不可取名：offset、limit！',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    rules: [{ required: true, message: '请输入字段名！', trigger: 'blur' }]
  },
  label: {
    label: '标签',
    type: 'Input',
    rules: [{ required: true, message: '请输入标签！', trigger: 'blur' }]
  },
  ptype: {
    label: '字段类型',
    type: 'Select',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    options: baseTypes.map(bsTyp => ({
      label: bsTyp,
      value: bsTyp
    })),
    rules: [{ required: true, message: '请选择字段类型！', trigger: 'change' }],
    onChange: (_prop: Property, toType: string) => {
      switch (toType) {
        case 'LongStr':
          propMapper['default'].type = 'Textarea'
          break
        case 'Object':
          propMapper['default'].type = 'CodeEditor'
          propMapper['default'].lang = 'json'
          break
        case 'Array':
          propMapper['default'].type = 'EditList'
          break
        case 'Boolean':
          propMapper['default'].type = 'Select'
          propMapper['default'].options = [
            { label: 'TRUE', value: 'true' },
            { label: 'FALSE', value: 'false' }
          ]
          break
        case 'DateTime':
          propMapper['default'].type = 'DateTime'
          break
        case 'Number':
          propMapper['default'].type = 'Number'
          break
        case 'String':
        default:
          propMapper['default'].type = 'Input'
          break
      }
      propEmitter.emit('update:mapper', propMapper)
      propEmitter.emit('update:data', { default: toType === 'Array' ? [] : null })
    }
  },
  index: {
    label: '是否为索引',
    type: 'Checkbox',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    placeholder: '索引可加速查找记录，但样本空间必须够大'
  },
  unique: {
    label: '是否唯一',
    type: 'Checkbox',
    disabled: [Cond.copy({ key: 'relative.model', cmp: '!=', val: '' })],
    placeholder: '重复的记录无法持久化'
  },
  default: {
    label: '默认值',
    type: 'Input'
  },
  relative: {
    label: '关联模型',
    type: 'Unknown'
  },
  remark: {
    label: '备注',
    type: 'Textarea'
  }
})

export const svcEmitter = new Emitter()

export const svcMapper = new Mapper({
  emit: {
    label: '激发类型',
    type: 'Select',
    options: emitTypeOpns
  },
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
    onChange: (svc: Service, to: Method) => {
      if (to === 'LINK') {
        svc.isModel = true
      }
      svcMapper['isModel'].disabled = to === 'LINK'
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
    type: 'Checkbox',
    display: [Cond.copy({ key: 'emit', cmp: '==', val: 'api' })]
  },
  cdValue: {
    label: '触发值',
    desc: '指定时间间隔或时刻',
    type: 'Input',
    display: [Cond.copy({ key: 'emit', cmp: '!=', val: 'api' })]
  },
  cdUnit: {
    label: '触发值',
    desc: '指定时间间隔或时刻',
    type: 'Select',
    options: timeUnits,
    display: [Cond.copy({ key: 'emit', cmp: '!=', val: 'api' })]
  },
  desc: {
    label: '描述',
    type: 'Textarea'
  }
})

export const svcColumns = [
  new Column('激活方式', 'emit'),
  new Column('路由/激发条件', 'pathCond'),
  new Column('访问方式/控制', 'methodCtrl'),
  new Column('描述', 'desc'),
  new Column('流程', 'flow')
]
