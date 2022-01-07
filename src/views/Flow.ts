import { reqDelete, reqGet, reqLink, reqPost } from '@/utils'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { Node, Mapper, Cond, Attr, Column, baseTypes } from '../common'
import { TinyEmitter as Emitter } from 'tiny-emitter'
export class EditNodeFormDlg {
  show: boolean
  mapper: Mapper
  current: Node
  emitter: Emitter

  constructor () {
    this.show = false
    this.current = new Node()
    this.emitter = new Emitter()
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
        default: new Attr(),
        onSaved: (input: Attr) => {
          if (!input.key) {
            this.current.inputs.push(
              Attr.copy(input)
            )
          }
        },
        onDeleted: (key: string) => {
          const index = this.current.inputs
            .findIndex((ipt: Attr) => ipt.key === key)
          if (index !== -1) {
            this.current.inputs.splice(index, 1)
          }
        }
      },
      outputs: {
        label: '输出',
        type: 'Table',
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
        default: new Attr(),
        onSaved: (output: Attr) => {
          if (!output.key) {
            this.current.outputs.push(
              Attr.copy(output)
            )
          }
        },
        onDeleted: (key: string) => {
          const index = this.current.outputs
            .findIndex((opt: Attr) => opt.key === key)
          if (index !== -1) {
            this.current.outputs.splice(index, 1)
          }
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
              const pvsKey = this.current.previous?.key
              let nxtKeys = []
              if (this.current.nexts.length) {
                if (typeof this.current.nexts[0] === 'string') {
                  nxtKeys = this.current.nexts
                } else {
                  nxtKeys = this.current.nexts.map((nxt: any) => nxt.key)
                }
              }
              await reqLink({
                parent: ['node', pvsKey],
                child: ['nexts', this.current.key]
              }, false)
              for (const nxtKey of nxtKeys) {
                await reqLink({
                  parent: ['node', pvsKey],
                  child: ['nexts', nxtKey],
                })
                await reqLink({
                  parent: ['node', nxtKey],
                  child: ['previous', pvsKey],
                })
              }
              await reqDelete('node', this.current.key)
              this.emitter.emit('remove:node', this.current.key)
              this.current.reset()
              this.emitter.emit('update:show', false)
              this.emitter.emit('refresh')
            },
          })
        }
      }
    })
  }

  async createNode (pvsKey: (Node | string)) {
    const newNode = Node.copy((await reqPost('node', this.current, {
      ignores:['previous', 'nexts', 'inputs', 'outputs']
    })).data)
    for (const input of this.current.inputs) {
      const iptKey = Attr.copy(
        (await reqPost('variable', input)).data
      ).key
      await reqLink({
        parent: ['node', newNode.key],
        child: ['inputs', iptKey],
      })
    }
    for (const output of this.current.outputs) {
      const optKey = Attr.copy(
        (await reqPost('variable', output)).data
      ).key
      await reqLink({
        parent: ['node', newNode.key],
        child: ['outputs', optKey],
      })
    }
    if (typeof pvsKey === 'string') {
      // 绑定根节点
      await reqLink({
        parent: ['route', pvsKey],
        child: ['flow', newNode.key]
      })
    } else {
      const previous = Node.copy((
        await reqGet('node', pvsKey.key)
      ).data as Node)
      if (previous.type === 'normal' && previous.nexts.length) {
        const nxtKey = (previous.nexts[0] as Node).key
        // 解绑
        await reqLink({
          parent: ['node', previous.key],
          child: ['nexts', nxtKey]
        }, false)
        // 为原来的子节点添加新父节点
        await reqLink({
          parent: ['node', newNode.key],
          child: ['nexts', nxtKey]
        })
        await reqLink({
          parent: ['node', nxtKey],
          child: ['previous', newNode.key]
        })
      }
      await reqLink({
        parent: ['node', previous.key],
        child: ['nexts', newNode.key]
      })
      await reqLink({
        parent: ['node', newNode.key],
        child: ['previous', previous.key]
      })
    }
    this.emitter.emit('refresh')
  }

  async saveCurrent (pvsKey: (Node | string)) {
    console.log(pvsKey)
  }
}

export const CardWidth = 300
export const ArrowHeight = 100
export const AddBtnWH = 32

export type NodeInPnl = Node & {
  posLT: [number, number],
  sizeWH: [number, number]
}
