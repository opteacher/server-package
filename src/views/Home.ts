import axios from 'axios'
import { Cond, DataBase, Mapper, Model, Project } from "@/common"
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import router from '@/router'
import { makeRequest, reqGet, reqPut } from '@/utils'

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
        display: Cond.copy({
          key: 'key',
          cmp: '!=',
          val: ''
        }),
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
              router.replace('/')
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

  display (show: boolean) {
    this.show = show
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

  onSync () {
    Modal.confirm({
      title: '确定同步项目到服务器？',
      icon: createVNode(ExclamationCircleOutlined),
      content: createVNode('div', {
        style: 'color:red;'
      }, '同步过程中，该项目已有的API将暂时停用！'),
      onOk: async () => {
        this.current.status = 'starting'
        await makeRequest(axios.put(`/server-package/api/v1/project/${this.current.key}/sync`), {
          messages: {
            loading: '同步中……',
            succeed: '同步成功！'
          }
        })
        await this.refresh()

        const h = setInterval(async () => {
          try {
            await axios.get(`/${this.current.name}/mdl/v1`)
          } catch (e) {
            console.log(`等待项目${this.current.name}启动……`)
          }
          clearInterval(h)
          this.current.status = 'running'
        }, 1000)
      },
    })
  }

  onStop () {
    Modal.confirm({
      title: '是否停止项目？',
      icon: createVNode(ExclamationCircleOutlined),
      content: '项目实例所提供的API服务也将同时停止！',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        await makeRequest(axios.put(`/server-package/api/v1/project/${this.current.key}/stop`), {
          middles: {
            before: () => {
              this.current.status = 'stopping'
            },
            after: () => {
              this.current.status = 'stopped'
            }
          },
          messages: {
            loading: '停止中……',
            succeed: '操作成功！'
          }
        })
        await this.refresh()
      },
    })
  }

  async onConfig (project: Project) {
    await reqPut('project', this.current.key, project, { ignores: ['models'] }),
    await this.refresh()
  }

  async refresh (pid?: string) {
    await this.initialize()
    Project.copy((await reqGet('project', pid || this.current.key)).data, this.current)
    for (const index in this.current.models) {
      const model = this.current.models[index]
      Model.copy((await reqGet('model', model.key)).data, model)
    }
  }
}
