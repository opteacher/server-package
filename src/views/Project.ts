/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import store from '@/store'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import _ from 'lodash'
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import Model from '@/types/model'
import { baseTypes, Cond, methods } from '@/types'
import Service, { emitTypeOpns } from '@/types/service'
import Deploy from '@/types/deploy'

export function onSync() {
  Modal.confirm({
    title: '确定同步项目到服务器？',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
      'div',
      {
        style: 'color:red;'
      },
      '同步过程中，该项目已有的服务将暂时停用！'
    ),
    onOk: () => store.dispatch('project/sync')
  })
}

export function onStop() {
  Modal.confirm({
    title: '是否停止项目？',
    icon: createVNode(ExclamationCircleOutlined),
    content: '项目实例所提供的服务也将同时停止！',
    okText: 'Yes',
    okType: 'danger',
    cancelText: 'No',
    onOk: () => store.dispatch('project/stop')
  })
}

export const modelEmitter = new Emitter()

export const ModelColumns = [
  new Column('模型名', 'name'),
  new Column('描述', 'desc'),
  new Column('记录时间', 'logTime'),
  new Column('数据集', 'dataset'),
  new Column('导出类', 'expCls'),
  new Column('设计', 'dsgnForm')
]

export const ModelMapper = new Mapper({
  name: {
    label: '模型名',
    type: 'Input',
    rules: [{ required: true, message: '请输入模型名！', trigger: 'blur' }]
  },
  desc: {
    type: 'Input'
  },
  logTime: {
    label: '是否记录新增时间和更新时间',
    type: 'Switch'
  },
  dataset: {},
  props: {
    expanded: true
  },
  expCls: {},
  dsgnForm: {}
})

export const expClsVsb = ref(false)

export class ExpClsForm {
  key: string
  name: string
  expType: 'typescript' | 'javascript'
  genCopy: boolean
  genReset: boolean

  constructor() {
    this.key = ''
    this.name = ''
    this.expType = 'typescript'
    this.genCopy = true
    this.genReset = true
  }

  reset() {
    this.key = ''
    this.name = ''
    this.expType = 'typescript'
    this.genCopy = true
    this.genReset = true
  }

  update(model: Model): ExpClsForm {
    this.key = model.key
    this.name = _.upperFirst(model.name)
    return this
  }

  static copy(src: any, tgt?: ExpClsForm): ExpClsForm {
    tgt = tgt || new ExpClsForm()
    tgt.key = src.key || tgt.key
    tgt.name = src.name || tgt.name
    tgt.expType = src.expType || tgt.expType
    tgt.genCopy = src.genCopy || tgt.genCopy
    tgt.genReset = src.genReset || tgt.genReset
    return tgt
  }
}

export const expClsForm = new ExpClsForm()

export const ExpClsMapper = new Mapper({
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

export const PropColumns = [
  new Column('字段名', 'name'),
  new Column('标签', 'label'),
  new Column('字段类型', 'type'),
  new Column('是否为索引', 'index'),
  new Column('是否唯一', 'unique'),
  new Column('是否可访问', 'visible'),
  new Column('备注', 'remark')
]

export const PropMapper = new Mapper({
  name: {
    label: '字段名',
    type: 'Input',
    rules: [{ required: true, message: '请输入字段名！', trigger: 'blur' }]
  },
  label: {
    label: '标签',
    type: 'Input',
    rules: [{ required: true, message: '请输入标签！', trigger: 'blur' }]
  },
  type: {
    label: '字段类型',
    type: 'Select',
    options: baseTypes.map(bsTyp => ({
      label: bsTyp,
      value: bsTyp
    })),
    rules: [{ type: 'array', required: true, message: '请选择字段类型！', trigger: 'change' }]
  },
  index: {
    label: '是否为索引',
    type: 'Switch'
  },
  unique: {
    label: '是否唯一',
    type: 'Switch'
  },
  visible: {
    label: '是否可访问',
    type: 'Switch'
  },
  remark: {
    label: '备注',
    type: 'Input'
  }
})

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

export class TransferForm {
  show: boolean
  emitter: Emitter
  mapper: Mapper

  constructor() {
    this.show = false
    this.emitter = new Emitter()
    this.mapper = new Mapper({
      file: {
        label: '上传传送文件',
        type: 'Upload',
        onChange: (_record: Transfer, info: any) => {
          for (const file of info.fileList) {
            if (file.status !== 'done') {
              this.emitter.emit('editable', false)
              return
            }
          }
          this.emitter.emit('editable', true)
        }
      },
      dest: {
        label: '投放位置',
        desc: '基于容器/app位置（注意：文件名不能修改，所以这里只能填写目录！）',
        type: 'Input'
      }
    })
  }
}

export class Transfer {
  file: string[] // 上传文件在服务器的临时位置
  dest: string // 文件投放到docker容器的位置（基于/app）
  project?: string // 项目名，也是docker容器名

  constructor() {
    this.file = []
    this.dest = ''
  }

  reset() {
    this.file = []
    this.dest = ''
  }

  static copy(src: any, tgt?: Transfer): Transfer {
    tgt = tgt || new Transfer()
    tgt.file = src.file || tgt.file
    tgt.dest = src.dest || tgt.dest
    tgt.project = src.project || tgt.project
    return tgt
  }
}
