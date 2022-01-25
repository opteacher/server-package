import { baseTypes, Column, Cond, Deploy, Mapper, Model, Project, Route, routeMethods, Transfer } from '@/common'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import store from '@/store'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export function onSync () {
  Modal.confirm({
    title: '确定同步项目到服务器？',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode('div', {
      style: 'color:red;'
    }, '同步过程中，该项目已有的API将暂时停用！'),
    onOk: () => store.dispatch('project/sync'),
  })
}

export function onStop () {
  Modal.confirm({
    title: '是否停止项目？',
    icon: createVNode(ExclamationCircleOutlined),
    content: '项目实例所提供的API服务也将同时停止！',
    okText: 'Yes',
    okType: 'danger',
    cancelText: 'No',
    onOk: () => store.dispatch('project/stop')
  })
}
export class ModelTable {
  columns: Column[]
  mapper: Mapper
  expandeds: string[]

  constructor() {
    this.columns = [
      new Column('模型名', 'name'),
      new Column('描述', 'desc'),
      new Column('记录时间', 'logTime'),
      new Column('数据集', 'dataset')
    ]
    this.mapper = new Mapper({
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
      dataset: {
        type: 'Unknown'
      },
      props: {
        expanded: true
      }
    })
    this.expandeds = []
  }
}

export class PropTable {
  columns: Column[]
  mapper: Mapper

  constructor() {
    this.columns = [
      new Column('字段名', 'name'),
      new Column('标签', 'label'),
      new Column('字段类型', 'type'),
      new Column('是否为索引', 'index'),
      new Column('是否唯一', 'unique'),
      new Column('是否可访问', 'visible'),
      new Column('备注', 'remark')
    ]
    this.mapper = new Mapper({
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
        options: baseTypes,
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
      },
    })
  }
}

export class RouteTable {
  columns: Column[]
  mapper: Mapper

  constructor() {
    this.columns = [
      new Column('访问方式', 'method'),
      new Column('路径', 'path'),
      new Column('编辑', 'flow')
    ]
    this.mapper = new Mapper({
      method: {
        label: '访问方式',
        type: 'Select',
        options: routeMethods
      },
      path: {
        type: 'Text'
      },
      flow: {}
    })
  }

  static genMdlPath (project: Project, model: Model | string, route: Route): string {
    if (typeof model === 'string') {
      model = Model.copy(project.models.find(mdl => mdl.key === model))
    }
    switch (route.method) {
    case 'POST':
      return `${project.path}/${model.name}`
    case 'DELETE':
    case 'PUT':
    case 'GET':
      return `${project.path}/${model.name}/:index`
    case 'ALL':
      return `${project.path}/${model.name}s`
    default:
      return ''
    }
  }
}

export class DeployForm {
  show: boolean
  mapper: Mapper

  constructor () {
    this.show = false
    this.mapper = new Mapper({
      gitURL: {
        label: '前端仓库URL',
        desc: 'git clone后的URL',
        type: 'Input',
        rules: [],
        onChange: (record: Deploy, to: string) => {
          if (to) {
            console.log(to)
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
        desc: '生成之后的首页的位置，【Vue】vue.config.js的outputDir',
        type: 'Input',
        rules: []
      },
      assetsPath: {
        label: '资源生成目录',
        desc: '生成之后的前端资源的位置，【Vue】vue.config.js的outputDir + assetsDir',
        type: 'Input'
      }
    })
  }
}

export class TransferForm {
  show: boolean
  emitter: Emitter
  mapper: Mapper

  constructor () {
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
