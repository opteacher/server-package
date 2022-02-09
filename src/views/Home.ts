/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Cond, DataBase, Mapper, Project } from '@/common'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import router from '@/router'
import { reqGet } from '@/utils'
import store from '@/store'

export class ProjForm {
  show: boolean
  mapper: Mapper
  editProj: Project

  constructor() {
    this.show = false
    this.editProj = new Project()
    this.mapper = new Mapper({
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
        label: '同步时清空数据库',
        type: 'Checkbox'
      },
      commands: {
        label: '前置命令',
        type: 'Textarea'
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
              this.mapper.operation.disabled = true
              this.mapper.operation.loading = true
              await store.dispatch('project/del')
              this.show = false
              this.mapper.operation.disabled = false
              this.mapper.operation.loading = false
              router.replace('/server-package')
            },
            onCancel() {
              console.log('Cancel')
            }
          })
        }
      }
    })
  }

  async initialize() {
    this.mapper.database.options = (await reqGet('databases')).map((org: any) => {
      const database = DataBase.copy(org)
      return {
        value: database.name,
        label: database.name,
        children: database.dbs.map((db: string) => ({
          value: db,
          label: db
        }))
      }
    })
  }
}
