import { reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { Node, Mapper, Cond, Variable, Column, baseTypes } from '../common'
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
        copy: Variable.copy,
        onSaved: (input: Variable, _extra: any, refresh: (data?: any[]) => void) => {
          this.onInOutputSaved('input', input, refresh)
        },
        onDeleted: (key: string, _extra: any, refresh: (data?: any[]) => void) => {
          this.onInOutputDeleted('input', key, refresh)
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
        copy: Variable.copy,
        onSaved: (output: Variable, _extra: any, refresh: (data?: any[]) => void) => {
          this.onInOutputSaved('output', output, refresh)
        },
        onDeleted: (key: string, _extra: any, refresh: (data?: any[]) => void) => {
          this.onInOutputDeleted('output', key, refresh)
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
              for (const input of this.current.inputs) {
                const iptKey = typeof input === 'string' ? input : input.key
                await reqLink({
                  parent: ['node', this.current.key],
                  child: ['inputs', iptKey]
                }, false)
                await reqDelete('variable', iptKey)
              }
              for (const output of this.current.outputs) {
                const optKey = typeof output === 'string' ? output : output.key
                await reqLink({
                  parent: ['node', this.current.key],
                  child: ['outputs', optKey]
                }, false)
                await reqDelete('variable', optKey)
              }
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
                await Promise.all([
                  reqLink({
                    parent: ['node', pvsKey],
                    child: ['nexts', nxtKey],
                  }),
                  reqLink({
                    parent: ['node', nxtKey],
                    child: ['previous', pvsKey],
                  })
                ])
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

  async onInOutputSaved (
    name: 'input' | 'output',
    edited: Variable,
    refresh: (data?: any[]) => void
  ) {
    if (!edited.key) {
      const addIOpt = Variable.copy(
        (await reqPost('variable', edited)).data
      )
      await reqLink({
        parent: ['node', this.current.key],
        child: [`${name}s`, addIOpt.key]
      })
    } else {
      await reqPut('variable', edited.key, edited)
    }
    await this.refresh()
    refresh(this.current[`${name}s`])
  }

  async onInOutputDeleted (
    name: 'input' | 'output',
    key: string,
    refresh: (data?: any[]) => void
  ) {
    await reqLink({
      parent: ['node', this.current.key],
      child: [`${name}s`, key]
    }, false)
    await reqDelete('variable', key)
    await this.refresh()
    refresh(this.current[`${name}s`])
  }

  async refresh () {
    Node.copy((await reqGet('node', this.current.key)).data, this.current)
  }

  async saveNode (pvsKey: (Node | string)) {
    const options = { ignores: ['previous', 'nexts', 'inputs', 'outputs'] }
    const newNode = Node.copy(this.current.key
      ? (await reqPut('node', this.current.key, this.current, options)).data
      : (await reqPost('node', this.current, options)).data
    )
    if (this.current.key) {
      this.emitter.emit('refresh')
      return Promise.resolve()
    }
    if (typeof pvsKey === 'string') {
      // 绑定根节点
      await reqLink({
        parent: ['route', pvsKey],
        child: ['flow', newNode.key]
      })
    } else {
      // 绑定非根节点
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
        await Promise.all([
          reqLink({
            parent: ['node', newNode.key],
            child: ['nexts', nxtKey]
          }),
          reqLink({
            parent: ['node', nxtKey],
            child: ['previous', newNode.key]
          })
        ])
      }
      await Promise.all([
        reqLink({
          parent: ['node', previous.key],
          child: ['nexts', newNode.key]
        }),
        reqLink({
          parent: ['node', newNode.key],
          child: ['previous', previous.key]
        })
      ])
    }
    this.emitter.emit('refresh')
  }
}

export const CardWidth = 300
export const CardHlfWid = CardWidth >> 1
export const ArrowHeight = 100
export const ArrowHlfHgt = ArrowHeight >> 1
export const AddBtnWH = 32
export const AddBtnHlfWH = AddBtnWH >> 1

export type NodeInPnl = Node & {
  posLT: [number, number],
  sizeWH: [number, number]
}
