import store from '@/store'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { Mapper, Cond, Variable, Column, baseTypes, Node, NodeTypeMapper } from '../common'

export const EditNodeMapper = new Mapper({
  title: {
    label: '标题',
    type: 'Input',
    rules: [{ required: true, message: '请输入节点标题！', trigger: 'blur' }]
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
    display: Cond.copy({
      key: 'key',
      cmp: '!=',
      val: ''
    }),
    columns: [
      new Column('参数名', 'name'),
      new Column('参数类型', 'type'),
      new Column('传入变量', 'variable')
    ],
    mapper: new Mapper({
      name: {
        type: 'Input'
      },
      type: {
        type: 'Select',
        options: baseTypes
      },
      variable: {
        type: 'Select',
        options: []
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
    display: Cond.copy({
      key: 'key',
      cmp: '!=',
      val: ''
    }),
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
    type: 'Textarea'
  },
  previous: {
    label: '父节点',
    type: 'Text',
    display: false
  },
  operation: {
    label: '操作',
    type: 'Button',
    display: Cond.copy({
      key: 'key',
      cmp: '!=',
      val: ''
    }),
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
