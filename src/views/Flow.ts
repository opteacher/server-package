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
    options: baseTypes.map(bsTyp => ({
      label: bsTyp, value: bsTyp
    })),
    onChange: (input: Variable, to: string) => {
      switch (to) {
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
        input.value = ''
        break
      case 'Object':
        InputMapper['value'].type = 'Select'
        store.commit('route/UPD_EDT_LOCVARS')
        InputMapper['value'].options = store.getters['route/locVars']
          .map((locVar: Variable) => ({
            label: locVar.name,
            value: locVar.name
          }))
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
      const locVars = store.getters['route/locVars']
      const selVar = locVars.find((v: any) => v.name === to)
      input.type = selVar.type
    }
  },
  prop: {
    label: '对象值分量',
    type: 'Input',
    display: [
      Cond.copy({ key: 'type', cmp: '==', val: 'Object' })
    ]
  }
})

export const EditNodeEmitter = new Emitter()

export const EditNodeMapper = new Mapper({
  temp: {
    label: '模板',
    type: 'Cascader',
    options: [],
    display: [
      Cond.copy({ key: 'key', cmp: '==', val: '' }),
    ],
    onChange (addNode: Node, to: [string, string]) {
      const temp = Node.copy(store.getters['route/node'](to[1]))
      temp.key = ''
      temp.isTemp = false
      Node.copy(temp, addNode)
    }
  },
  title: {
    label: '标题',
    type: 'Input',
    display: [
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ]
  },
  desc: {
    label: '描述',
    type: 'Textarea',
    display: [
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ],
    maxRows: 2
  },
  type: {
    label: '类型',
    type: 'Select',
    options: Object.entries(NodeTypeMapper).map(([key, val]) => ({
      label: val, value: key
    }))
  },
  inputs: {
    label: '输入',
    type: 'Table',
    show: false,
    emitter: InputEmitter,
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ],
    columns: [
      new Column('参数名', 'name'),
      new Column('参数类型', 'type'),
      new Column('传入变量', 'value'),
      new Column('变量分量', 'prop')
    ],
    mapper: InputMapper,
    dsKey: '',
    copy: Variable.copy,
    onSaved: async (input: Variable) => {
      await store.dispatch('route/saveInOutput', {
        name: 'input', edited: input
      })
      EditNodeEmitter.emit('update:data', store.getters['route/editNode'])
    },
    onDeleted: async (key: string) => {
      await store.dispatch('route/delInOutput', {
        name: 'input', delKey: key
      })
      EditNodeEmitter.emit('update:data', store.getters['route/editNode'])
    }
  },
  outputs: {
    label: '输出',
    type: 'Table',
    show: false,
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condNode' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ],
    columns: [
      new Column('返回名', 'name')
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
      }
    }),
    dsKey: '',
    copy: Variable.copy,
    onSaved: async (output: Variable) => {
      await store.dispatch('route/saveInOutput', {
        name: 'output', edited: output
      })
      EditNodeEmitter.emit('update:data', store.getters['route/editNode'])
    },
    onDeleted: async (key: string) => {
      await store.dispatch('route/delInOutput', {
        name: 'output', delKey: key
      })
      EditNodeEmitter.emit('update:data', store.getters['route/editNode'])
    }
  },
  code: {
    label: '代码',
    type: 'Textarea',
    display: [
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'traversal' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ]
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
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ],
    primary: true,
    inner: '加入库',
    onClick: () => {
      store.commit('route/SET_JOIN_VSB', true)
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
      await store.dispatch('route/saveNode', { key, group: '' })
      EditNodeEmitter.emit('update:data', store.getters['route/editNode'])
    }
  },
  delete: {
    label: '操作',
    type: 'Button',
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
    ],
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
          store.commit('route/SET_NODE_INVSB')
          await store.dispatch('route/delNode', node.key)
          store.commit('route/RESET_NODE')
        },
      })
    }
  }
})

export const RouteMapper = new Mapper({
  path: {
    label: '路由',
    type: 'Input',
    prefix: ''
  },
  method: {
    label: '访问方式',
    type: 'Select',
    options: routeMethods.map(mthd => ({
      label: mthd, value: mthd
    }))
  },
  service: {
    label: '绑定服务',
    type: 'SelOrIpt',
    options: [],
    mode: ref('select')
  },
  interface: {
    label: '接口',
    type: 'Input'
  }
})

export async function onNodeSaved (node: Node, next: () => void) {
  await store.dispatch('route/saveNode', Node.copy(node))
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
