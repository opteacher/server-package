/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import router from '@/router'
import store from '@/store'
import Mapper from '@/types/mapper'
import { Cond } from '@/types'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Column from '@/types/column'

export const emitter = new Emitter()

export const columns = [
  new Column('名称', 'name'),
  new Column('说明', 'desc'),
  new Column('占用端口', 'port'),
  new Column('数据库', 'database'),
  new Column('独立', 'independ'),
  new Column('状态', 'status', { width: 80 }),
  new Column('操作项目', 'operation', { width: 200 })
]

export const mapper = new Mapper({
  name: {
    label: '项目名称',
    type: 'Input',
    rules: [{ required: true, message: '请输入项目名称！', trigger: 'blur' }]
  },
  desc: {
    label: '项目说明',
    type: 'Input',
    rules: [{ required: true, message: '请输入项目说明！', trigger: 'blur' }]
  },
  port: {
    label: '占用端口',
    type: 'Number',
    rules: [{ type: 'number', required: true, message: '请输入占用端口！', trigger: 'blur' }]
  },
  database: {
    label: '数据库',
    type: 'Cascader',
    options: [],
    rules: [{ type: 'array', required: true, message: '请选择数据库！', trigger: 'change' }]
  },
  dropDbs: {
    label: '启动时清空数据库',
    type: 'Checkbox'
  },
  commands: {
    label: '高级',
    type: 'Group',
    items: {
      commands: {
        label: '前置命令',
        type: 'Textarea'
      },
      independ: {
        label: '独立部署',
        type: 'Checkbox',
        desc: '为true时项目将不依赖server-package，可以单独部署，但秘钥也将独立保存'
      }
    }
  },
  operation: {
    label: '操作项目',
    display: [Cond.copy({ key: 'key', cmp: '!=', val: '' })],
    type: 'Button',
    inner: '删除项目',
    danger: true,
    onClick: () => {
      Modal.confirm({
        title: '是否删除项目？',
        icon: createVNode(ExclamationCircleOutlined),
        content: '项目实例所提供的服务也将同时停止！',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          mapper.operation.disabled = true
          mapper.operation.loading = true
          await store.dispatch('project/del')
          emitter.emit('show', false)
          mapper.operation.disabled = false
          mapper.operation.loading = false
          router.replace('/server-package')
        },
        onCancel() {
          console.log('Cancel')
        }
      })
    }
  }
})
