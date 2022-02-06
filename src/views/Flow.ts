/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import store from '@/store'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import {
  Mapper,
  Cond,
  Variable,
  Column,
  baseTypes,
  Node,
  NodeTypeMapper,
  routeMethods,
  Service
} from '../common'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Moment } from 'moment'

const InputEmitter = new Emitter()

const InputMapper = new Mapper({
  name: {
    label: '参数名',
    type: 'Input',
    prefix: 'I'
  },
  type: {
    label: '类型',
    type: 'Select',
    options: baseTypes.map(bscType => ({
      label: bscType,
      value: bscType
    })),
    onChange: (input: Variable, to: string) => {
      switch (to) {
        case 'Any':
        case 'String':
          InputMapper['value'].type = 'Input'
          input.value = ''
          break
        case 'Number':
          InputMapper['value'].type = 'Number'
          input.value = 0
          break
        case 'Boolean':
          InputMapper['value'].type = 'Checkbox'
          input.value = false
          break
        case 'DateTime':
          InputMapper['value'].type = 'DateTime'
          input.value = ref<Moment>()
          break
        case 'Array':
          InputMapper['value'].type = 'Input'
          InputMapper['value'].prefix = '['
          InputMapper['value'].suffix = ']'
          input.value = ''
          break
        case 'Object':
          InputMapper['value'].type = 'Select'
          store.commit('service/UPD_EDT_LOCVARS')
          InputMapper['value'].options = store.getters['service/locVars'].map(
            (locVar: Variable) => ({
              label: locVar.value || locVar.name,
              value: locVar.value || locVar.name
            })
          )
          input.value = ''
          input.prop = ''
          break
      }
      InputEmitter.emit('update:mapper', InputMapper)
    }
  },
  value: {
    label: '值',
    type: 'Select',
    options: [],
    onChange: (input: Variable, to: string) => {
      if (input.type !== 'Object') {
        return
      }
      const locVars = store.getters['service/locVars']
      const selVar = locVars.find((v: any) => v.value === to || v.name === to)
      input.type = selVar.type
    }
  },
  prop: {
    label: '对象值分量',
    desc: '如果还定义索引，则默认索引在前，分量在后（e.g: object[index].prop）',
    type: 'Input',
    display: [Cond.copy({ key: 'type', cmp: '==', val: 'Object' })]
  },
  index: {
    label: '索引',
    type: 'Input',
    display: {
      OR: [
        Cond.copy({ key: 'type', cmp: '==', val: 'Object' }),
        Cond.copy({ key: 'type', cmp: '==', val: 'Array' })
      ]
    }
  },
  idxType: {
    label: '索引类型',
    type: 'Select',
    options: baseTypes.map(bscType => ({
      label: bscType,
      value: bscType
    })),
    display: {
      OR: [
        Cond.copy({ key: 'type', cmp: '==', val: 'Object' }),
        Cond.copy({ key: 'type', cmp: '==', val: 'Array' })
      ]
    }
  },
  remark: {
    label: '备注',
    type: 'Input'
  }
})

export const EditNodeEmitter = new Emitter()

export const EditNodeMapper = new Mapper({
  temp: {
    label: '模板',
    type: 'Cascader',
    options: [],
    display: [Cond.copy({ key: 'key', cmp: '==', val: '' })],
    onChange(addNode: Node, to: [string, string]) {
      const temp = Node.copy(store.getters['service/node'](to[1]))
      temp.key = ''
      temp.isTemp = false
      Node.copy(temp, addNode)
    }
  },
  title: {
    label: '标题',
    type: 'Input',
    display: [Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' })]
  },
  desc: {
    label: '描述',
    type: 'Textarea',
    display: [Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' })],
    maxRows: 2
  },
  type: {
    label: '类型',
    type: 'Select',
    options: Object.entries(NodeTypeMapper).map(([key, val]) => ({
      label: val,
      value: key
    }))
  },
  loop: {
    label: '循环类型',
    type: 'Select',
    display: [Cond.copy({ key: 'type', cmp: '==', val: 'traversal' })],
    options: [
      { label: 'for-in循环', value: 'for-in' },
      { label: 'for-of循环', value: 'for-of' }
    ]
  },
  inputs: {
    label: '输入',
    type: 'Table',
    show: false,
    emitter: InputEmitter,
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' })
    ],
    columns: [
      new Column('参数名', 'name'),
      new Column('参数类型', 'type'),
      new Column('传入变量', 'value'),
      new Column('变量分量', 'prop'),
      new Column('备注', 'remark')
    ],
    mapper: InputMapper,
    dsKey: '',
    copy: Variable.copy,
    onSaved: async (input: Variable, next: () => void) => {
      await store.dispatch('service/saveInOutput', {
        name: 'input',
        edited: input
      })
      EditNodeEmitter.emit('update:data', store.getters['service/editNode'])
      next()
    },
    onDeleted: async (key: string) => {
      await store.dispatch('service/delInOutput', {
        name: 'input',
        delKey: key
      })
      EditNodeEmitter.emit('update:data', store.getters['service/editNode'])
    },
    addable: [Cond.copy({ key: 'type', cmp: '!=', val: 'traversal' })],
    delable: [Cond.copy({ key: 'type', cmp: '!=', val: 'traversal' })]
  },
  outputs: {
    label: '输出',
    type: 'Table',
    show: false,
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condNode' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' })
    ],
    columns: [
      new Column('返回名', 'name'),
      new Column('重名为', 'value'),
      new Column('备注', 'remark')
    ],
    mapper: new Mapper({
      name: {
        label: '返回名',
        type: 'Input',
        prefix: 'O'
      },
      value: {
        label: '重命名',
        desc: '之后该输出将被替换为该名称',
        type: 'Input'
      },
      remark: {
        label: '备注',
        type: 'Input'
      }
    }),
    dsKey: '',
    copy: Variable.copy,
    onSaved: async (output: Variable, next: () => void) => {
      output.type = 'Object'
      await store.dispatch('service/saveInOutput', {
        name: 'output',
        edited: output
      })
      EditNodeEmitter.emit('update:data', store.getters['service/editNode'])
      next()
    },
    onDeleted: async (key: string) => {
      await store.dispatch('service/delInOutput', {
        name: 'output',
        delKey: key
      })
      EditNodeEmitter.emit('update:data', store.getters['service/editNode'])
    },
    delable: [Cond.copy({ key: 'type', cmp: '!=', val: 'traversal' })]
  },
  code: {
    label: '代码',
    type: 'Textarea',
    display: [
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'traversal' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' })
    ],
    maxRows: 6
  },
  previous: {
    label: '父节点',
    type: 'Text',
    display: false
  },
  addLib: {
    label: '操作',
    type: 'Button',
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'group', cmp: '==', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' })
    ],
    primary: true,
    inner: '加入库',
    onClick: () => {
      store.commit('service/SET_JOIN_VSB', true)
    }
  },
  group: {
    label: '节点库',
    type: 'Delable',
    display: [
      Cond.copy({ key: 'group', cmp: '!=', val: '' }),
      Cond.copy({ key: 'isTemp', cmp: '!=', val: true })
    ],
    onDeleted: async (key: string) => {
      await store.dispatch('service/saveNode', { key, group: '' })
      EditNodeEmitter.emit('update:data', store.getters['service/editNode'])
    }
  },
  delete: {
    label: '操作',
    type: 'Button',
    display: [Cond.copy({ key: 'key', cmp: '!=', val: '' })],
    inner: '删除节点',
    danger: true,
    onClick: (node: Node) => {
      Modal.confirm({
        title: '是否删除该节点？',
        icon: createVNode(ExclamationCircleOutlined),
        content: '需同步项目后业务逻辑才会更新！',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          store.commit('service/SET_NODE_INVSB')
          await store.dispatch('service/delNode', node.key)
          store.commit('service/RESET_NODE')
        }
      })
    }
  }
})

export const ServiceMapper = new Mapper({
  path: {
    label: '路由',
    type: 'Input',
    prefix: '',
    onChange: (svc: Service, path: string) => {
      if (!path.startsWith('/')) {
        svc.path = `/${path}`
      }
    }
  },
  method: {
    label: '访问方式',
    type: 'Select',
    options: routeMethods.map(mthd => ({
      label: mthd,
      value: mthd
    }))
  },
  name: {
    label: '绑定服务',
    type: 'SelOrIpt',
    options: [],
    mode: ref('select')
  },
  interface: {
    label: '接口',
    type: 'Input'
  },
  deps: {
    label: '依赖',
    type: 'ListSelect',
    options: []
  }
})

export async function onNodeSaved(node: Node, next: () => void) {
  await store.dispatch('service/saveNode', Node.copy(node))
  next()
}

export const JoinMapper = new Mapper({
  group: {
    label: '节点组',
    type: 'SelOrIpt',
    options: [],
    mode: 'select'
  }
})
