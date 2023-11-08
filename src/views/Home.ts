/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { pjtAPI as api } from '@/apis'
import router from '@/router'
import store from '@/store'
import { Cond } from '@/types'
import Project from '@/types/project'
import { reqAll, setProp } from '@/utils'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { createVNode } from 'vue'

export const emitter = new Emitter()

export const columns = [
  new Column('名称', 'name'),
  new Column('说明', 'desc'),
  new Column('占用端口', 'port', { width: 100 }),
  new Column('数据库', 'database'),
  new Column('独立部署', 'independ', { width: 80 }),
  new Column('状态', 'status', { width: 80 }),
  new Column('操作项目', 'operation', { width: 200 })
]

const evarsEmitter = new Emitter()

export const mapper = new Mapper({
  ptype: {
    label: '项目类型',
    type: 'Radio',
    rules: [{ required: true, message: '请选择项目类型！', trigger: 'blur' }],
    options: [
      { label: '前端', value: 'frontend' },
      { label: '后端', value: 'backend' }
    ],
    style: 'button',
    disabled: [new Cond({ key: 'key', cmp: '!=', val: '' })],
    onChange: async (_pjt: Project, selected: 'frontend' | 'backend') => {
      emitter.emit('update:mprop', {
        'database.rules[0].required': selected === 'backend'
      })
      if (selected === 'frontend') {
        emitter.emit('update:mprop', {
          'backend.options': await reqAll('project', {
            messages: { notShow: true },
            copy: Project.copy
          }).then(projects =>
            projects.map((project: Project) => ({ label: project.name, value: project.key }))
          )
        })
      }
    }
  },
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
    rules: [{ type: 'array', required: true, message: '请选择数据库！', trigger: 'change' }],
    display: [new Cond({ key: 'ptype', cmp: '!=', val: 'frontend' })]
  },
  dropDbs: {
    label: '启动时清空数据库',
    type: 'Checkbox',
    display: [new Cond({ key: 'ptype', cmp: '!=', val: 'frontend' })]
  },
  commands: {
    label: '高级',
    type: 'FormGroup',
    items: {
      commands: {
        label: '前置命令',
        type: 'Textarea'
      },
      independ: {
        label: '独立部署',
        type: 'Checkbox',
        placeholder: '为true时项目将不依赖server-package，可以单独部署，但秘钥也将独立保存',
        display: [new Cond({ key: 'ptype', cmp: '!=', val: 'frontend' })]
      },
      volumes: {
        label: '共享文件/夹',
        type: 'EditList',
        mapper: {
          dest: {
            type: 'Input',
            placeholder: '投送到……'
          },
          src: {
            type: 'Input',
            placeholder: '容器内……'
          }
        },
        newFun: () => ({ dest: '/', src: '/' })
      },
      envVars: {
        label: '环境变量',
        type: 'Table',
        mapper: new Mapper({
          name: {
            label: '变量名',
            type: 'Input'
          },
          value: {
            label: '变量值',
            type: 'Input'
          }
        }),
        columns: [new Column('变量名', 'name'), new Column('变量值', 'value')],
        emitter: evarsEmitter,
        newFun: () => ({ key: '', name: '', value: '' }),
        onSaved: (evar: { key: string; name: string; value: string }, extra?: any) => {
          extra.push({ name: evar.name, value: evar.value })
          evarsEmitter.emit('update:show', false)
        },
        onDeleted: (key: any, extra?: any) => {
          extra.splice(
            extra.findIndex((evar: any) => evar.key === key),
            1
          )
          evarsEmitter.emit('update:show', false)
        },
        edtable: false
      },
      expPorts: {
        label: '暴露端口',
        type: 'EditList',
        mapper: new Mapper({
          value: {
            type: 'Number'
          }
        }),
        newFun: () => ({ value: '' }),
        desc: '尽量不要暴露过多端口，这里的端口以0.0.0.0映射进容器，所以不受nginx管理，不符合sp的规则！'
      }
    }
  },
  operation: {
    label: '操作项目',
    display: [new Cond({ key: 'key', cmp: '!=', val: '' })],
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
          await api.remove(store.getters['project/ins'].key)
          emitter.emit('show', false)
          mapper.operation.disabled = false
          mapper.operation.loading = false
          router.replace('/')
        },
        onCancel() {
          console.log('Cancel')
        }
      })
    }
  }
})
