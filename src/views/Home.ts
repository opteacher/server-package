import axios from 'axios'
import { DataBase, Mapper, Project } from "@/common"
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import router from '@/router'

export class EditProjFormDlg {
  show: boolean
  mapper: Mapper
  current: Project

  constructor () {
    this.show = false
    this.mapper = new Mapper({
      name: {
        label: '项目名称',
        type: 'Input',
        rules: [
          { required: true, message: '请输入项目名称！', trigger: 'blur' }
        ]
      },
      desc: {
        label: '项目说明',
        type: 'Input',
        rules: [
          { required: true, message: '请输入项目说明！', trigger: 'blur' }
        ]
      },
      port: {
        label: '占用端口',
        type: 'Number',
        rules: [
          { type: 'number', required: true, message: '请输入占用端口！', trigger: 'blur' }
        ]
      },
      database: {
        label: '数据库',
        type: 'Cascader',
        options: [],
        rules: [
          { type: 'array', required: true, message: '请选择数据库！', trigger: 'change' }
        ]
      },
      operation: {
        label: '操作项目',
        type: 'Button',
        inner: '删除项目',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: '是否删除项目？',
            icon: createVNode(ExclamationCircleOutlined),
            content: '项目实例所提供的API服务也将同时停止！',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
              this.mapper.operation.disabled = true
              this.mapper.operation.loading = true
              await axios.delete(`/server-package/api/v1/project/${this.current.key}`)
              this.show = false
              this.mapper.operation.disabled = false
              this.mapper.operation.loading = false
              router.replace('/#/home')
            },
            onCancel() {
              console.log('Cancel')
            },
          })
        }
      }
    })
    this.current = new Project()
  }

  async initialize () {
    this.mapper.database.options = (await axios.get('/server-package/mdl/v1/databases')).data.data.map((org: any) => {
      const database = DataBase.copy(org)
      return {
        value: database.name,
        label: database.name,
        children: database.dbs.map((db: string) => ({
          value: db, label: db
        }))
      }
    })
  }
}
