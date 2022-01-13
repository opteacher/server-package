import { baseTypes, Column, Mapper, routeMethods } from '@/common'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import store from '@/store'

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
        type: 'Input',
      },
      flow: {}
    })
  }
}
