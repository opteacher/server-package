import store from '@/store'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { Node, Mapper, Cond, Variable, Column, baseTypes } from '../common'
export class NodeForm {
  show: boolean
  mapper: Mapper
  editNode: Node

  constructor () {
    this.show = false
    this.editNode = new Node()
    this.mapper = new Mapper({
      title: {
        label: '标题',
        type: 'Input',
        rules: [{ required: true, message: '请输入节点标题！', trigger: 'blur' }]
      },
      type: {
        label: '类型',
        type: 'Select',
        options: [{
          title: '普通',
          value: 'normal'
        }, {
          title: '条件',
          value: 'condition'
        }, {
          title: '遍历',
          value: 'traversal'
        }]
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
        dsKey: `route/nodes.${this.editNode.key}.inputs`,
        copy: Variable.copy,
        onSaved: (input: Variable, refresh: (data?: any[]) => void) => {
          return store.dispatch('route/saveInOutput', {
            name: 'input',
            ndKey: this.editNode.key,
            edited: input
          })
        },
        onDeleted: (key: string, refresh: (data?: any[]) => void) => {
          return store.dispatch('route/delInOutput', {
            name: 'input',
            ndKey: this.editNode.key,
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
        dsKey: `route/nodes.${this.editNode.key}.outputs`,
        copy: Variable.copy,
        onSaved: (output: Variable, refresh: (data?: any[]) => void) => {
          return store.dispatch('route/saveInOutput', {
            name: 'output',
            ndKey: this.editNode.key,
            edited: output
          })
        },
        onDeleted: (key: string, refresh: (data?: any[]) => void) => {
          return store.dispatch('route/delInOutput', {
            name: 'output',
            ndKey: this.editNode.key,
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
        onClick: () => {
          Modal.confirm({
            title: '是否删除该节点？',
            icon: createVNode(ExclamationCircleOutlined),
            content: '需同步项目后业务逻辑才会更新！',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
              await store.dispatch('route/delNode', this.editNode.key)
              this.editNode.reset()
              this.show = false
            },
          })
        }
      }
    })
  }

  setEditNode (node: Node) {
    this.editNode.reset()
    Node.copy(node, this.editNode)
    this.mapper.inputs.dsKey = `route/nodes.${this.editNode.key}.inputs`
    this.mapper.outputs.dsKey = `route/nodes.${this.editNode.key}.outputs`
    this.show = true
  }
}
