import store from '@/store'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import { Mapper, Cond, Variable, Column, baseTypes, Node, NodeTypeMapper } from '../common'

export const EditNodeMapper = new Mapper({
  temp: {
    label: '模板',
    type: 'Cascader',
    options: [],
    display: [
      Cond.copy({ key: 'key', cmp: '==', val: '' }),
    ],
    onChange (addNode: Node, to: [string, string]) {

    }
  },
  title: {
    label: '标题',
    type: 'Input',
    rules: [{ required: true, message: '请输入节点标题！', trigger: 'blur' }]
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
      title: val,
      value: key
    }))
  },
  inputs: {
    label: '输入',
    type: 'Table',
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ],
    columns: [
      new Column('参数名', 'name'),
      new Column('参数类型', 'type'),
      new Column('传入变量', 'value')
    ],
    mapper: new Mapper({
      name: {
        type: 'Input'
      },
      type: {
        type: 'Select',
        options: baseTypes
      },
      value: {
        type: 'Select',
        options: [],
        onChange: (input: Variable, to: string) => {
          const locVars = store.getters['route/locVars']()
          const selVar = locVars.find((v: any) => v.name === to)
          input.type = selVar.type
        }
      }
    }),
    dsKey: '',
    copy: Variable.copy,
    onSaved: (input: Variable) => {
      return store.dispatch('route/saveInOutput', {
        name: 'input',
        ndKey: store.getters['route/editNode'].key,
        edited: input
      })
    },
    onDeleted: (key: string) => {
      return store.dispatch('route/delInOutput', {
        name: 'input',
        ndKey: store.getters['route/editNode'].key,
        delKey: key
      })
    }
  },
  outputs: {
    label: '输出',
    type: 'Table',
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condNode' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'endNode' }),
    ],
    columns: [
      new Column('返回名', 'name'),
      new Column('返回类型', 'type')
    ],
    mapper: new Mapper({
      name: {
        type: 'Input'
      },
      type: {
        type: 'Select',
        options: baseTypes
      }
    }),
    dsKey: '',
    copy: Variable.copy,
    onSaved: (output: Variable) => {
      return store.dispatch('route/saveInOutput', {
        name: 'output',
        ndKey: store.getters['route/editNode'].key,
        edited: output
      })
    },
    onDeleted: (key: string) => {
      return store.dispatch('route/delInOutput', {
        name: 'output',
        ndKey: store.getters['route/editNode'].key,
        delKey: key
      })
    }
  },
  code: {
    label: '代码',
    type: 'Textarea',
    display: [
      Cond.copy({ key: 'key', cmp: '!=', val: '' }),
      Cond.copy({ key: 'type', cmp: '!=', val: 'condition' }),
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
      Cond.copy({ key: 'group', cmp: '!=', val: '' })
    ],
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
          store.commit('route/SET_INVISIBLE')
          await store.dispatch('route/delNode', node.key)
          store.commit('route/RESET_NODE')
        },
      })
    }
  }
})
