import { baseTypes, Column, Cond, Deploy, Mapper, Model, Project, Route, routeMethods, Transfer } from '@/common'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import store from '@/store'
import { message } from 'ant-design-vue'

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
      new Column('是否记录新增时间和更新时间', 'logTime')
    ]
    this.mapper = new Mapper({
      name: {
        label: '模型名',
        type: 'Input',
        rules: [{ required: true, message: '请输入模型名！', trigger: 'blur' }]
      },
      logTime: {
        label: '是否记录新增时间和更新时间',
        type: 'Switch'
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
      new Column('字段类型', 'type'),
      new Column('是否为索引', 'index'),
      new Column('是否唯一', 'unique'),
      new Column('是否可访问', 'visible')
    ]
    this.mapper = new Mapper({
      name: {
        label: '字段名',
        type: 'Input',
        rules: [{ required: true, message: '请输入字段名！', trigger: 'blur' }]
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
      }
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
  mapper: Mapper

  constructor () {
    this.show = false
    this.mapper = new Mapper({
      file: {
        label: '上传传送文件',
        type: 'Upload',
        onChange: (record: Transfer, info: any) => {
          if (info.file.status !== 'uploading') {
            console.log(info.file, info.fileList);
          }
          if (info.file.status === 'done') {
            message.success(`${info.file.name} file uploaded successfully`);
          } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
          }
        }
      },
      dest: {
        label: '投放位置',
        desc: '基于容器/app位置',
        type: 'Input'
      }
    })
  }
}
