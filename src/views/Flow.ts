/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import store from '@/store'
import { Cond, baseTypes, bsTpOpns } from '@/types'
import Node, { NodeType } from '@/types/node'
import Service from '@/types/service'
import Variable from '@/types/variable'
import { setProp, until } from '@/utils'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import { Moment } from 'moment'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { v4 as uuid } from 'uuid'
import { createVNode, ref } from 'vue'

import { ndAPI as api } from '../apis'

function scanLocVars(ndKey: string): Variable[] {
  const nodes = store.getters['service/nodes']
  if (!(ndKey in nodes)) {
    return []
  }
  const node = nodes[ndKey]
  const ret = [] as Variable[]
  if (node.previous) {
    ret.push(...scanLocVars(node.previous))
  }
  return ret.concat(node.outputs)
}

export function getLocVars(node?: Node, incSelf = false): Variable[] {
  if (!node) {
    node = store.getters['service/node'] as Node
  }
  const service = store.getters['service/ins'] as Service
  return [Variable.copy({ key: 'context', name: 'ctx', type: 'Object' })]
    .concat(service.stcVars)
    .concat(incSelf ? node.outputs : [])
    .concat(node.previous ? scanLocVars(node.previous) : [])
}

const iptMapper = new Mapper({
  name: {
    label: '参数名',
    type: 'Input'
  },
  vtype: {
    label: '类型',
    type: 'Select',
    options: bsTpOpns,
    onChange: (input: Variable, to: string) => {
      switch (to) {
        case 'Any':
        case 'String':
          iptMapper['value'].type = 'Input'
          input.value = ''
          break
        case 'Number':
          iptMapper['value'].type = 'Number'
          input.value = 0
          break
        case 'Boolean':
          iptMapper['value'].type = 'Checkbox'
          input.value = false
          break
        case 'DateTime':
          iptMapper['value'].type = 'DateTime'
          input.value = ref<Moment>()
          break
        case 'Array':
          iptMapper['value'].type = 'Input'
          input.value = []
          break
        case 'Unknown':
          iptMapper['value'].type = 'Input'
          input.value = ''
          break
        case 'Object':
          iptMapper['value'].type = 'Select'
          nodeEmitter.emit('update:mprop', {
            'advanced.items.inputs.mapper.value.options': getLocVars().map((locVar: Variable) => ({
              label: locVar.value || locVar.name,
              value: locVar.value || locVar.name
            }))
          })
          input.value = ''
          input.prop = ''
          break
      }
      nodeEmitter.emit('update:mprop', {
        'advanced.items.inputs.mapper.value.type': iptMapper['value'].type
      })
    }
  },
  value: {
    label: '值',
    type: 'Select',
    options: [],
    onChange: (input: Variable, to: string) => {
      if (input.vtype !== 'Object' && input.vtype !== 'Unknown') {
        return
      }
      const edtNode = store.getters['service/editNode']
      const pvsNode = store.getters['service/node'](edtNode.previous)
      const selVar = pvsNode
        ? getLocVars(pvsNode, true).find((v: any) => v.value === to || v.name === to)
        : input
      if (selVar) {
        input.name = selVar.value || selVar.name
      }
    }
  },
  prop: {
    label: '对象值分量',
    desc: '如果还定义索引，则默认索引在前，分量在后（e.g: object[index].prop）',
    type: 'Input',
    display: [new Cond({ key: 'vtype', cmp: '=', val: 'Object' })]
  },
  index: {
    label: '索引',
    type: 'Input',
    display: {
      OR: [
        new Cond({ key: 'vtype', cmp: '=', val: 'Object' }),
        new Cond({ key: 'vtype', cmp: '=', val: 'Array' })
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
        new Cond({ key: 'vtype', cmp: '=', val: 'Object' }),
        new Cond({ key: 'vtype', cmp: '=', val: 'Array' })
      ]
    }
  },
  remark: {
    label: '备注',
    type: 'Textarea'
  }
})

export const nodeEmitter = new Emitter()

const depEmitter = new Emitter()

export const nodeMapper = new Mapper({
  title: {
    label: '标题',
    type: 'Input',
    display: [new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })],
    rules: [{ required: true, message: '标题不能为空！' }]
  },
  desc: {
    label: '描述',
    type: 'Textarea',
    display: [new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })],
    maxRows: 2
  },
  ntype: {
    label: '类型',
    type: 'Select',
    onChange: (node: Node, to: NodeType) => {
      if (to === 'condNode') {
        node.isFun = false
      }
    }
  },
  advanced: {
    label: '开发者配置',
    type: 'FormGroup',
    display: [
      new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
      new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
    ],
    items: {
      inputs: {
        label: '输入',
        type: 'Table',
        emitter: new Emitter(),
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ],
        columns: [
          new Column('参数名', 'name'),
          new Column('参数类型', 'vtype'),
          new Column('传入变量', 'value'),
          new Column('变量分量', 'prop'),
          new Column('备注', 'remark')
        ],
        mapper: iptMapper,
        newFun: () => new Variable(),
        onEdit: (node: any) => {
          let options = []
          if (node.previous) {
            const pvsNode = store.getters['service/node'](node.previous)
            options = getLocVars(pvsNode, true).map((locVar: Variable) => ({
              label: locVar.value || locVar.name,
              value: locVar.value || locVar.name
            }))
          } else {
            const service = store.getters['service/ins'] as Service
            options = [{ label: 'ctx', value: 'ctx' }].concat(
              service.stcVars.map(v => ({ label: v.name, value: v.name }))
            )
          }
          nodeEmitter.emit('update:mprop', {
            'advanced.items.inputs.mapper.value.options': options
          })
        },
        onSaved: (src: Variable, ipts: Variable[]) => {
          const tgt = ipts.find(v => v.key === src.key)
          if (src.key && tgt) {
            Variable.copy(src, tgt)
          } else {
            ipts.push(setProp(Variable.copy(src), 'key', uuid()))
          }
        },
        onDeleted: (key: any, ipts: Variable[]) => {
          ipts.splice(
            ipts.findIndex(ipt => ipt.key === key),
            1
          )
        },
        addable: [new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' })],
        delable: [new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' })],
        editable: true
      },
      outputs: {
        label: '输出',
        type: 'Table',
        emitter: new Emitter(),
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'condNode' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'subNode' })
        ],
        columns: [
          new Column('返回名', 'name'),
          new Column('重名为', 'value'),
          new Column('备注', 'remark')
        ],
        mapper: new Mapper({
          name: {
            label: '返回名',
            type: 'Input'
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
        newFun: () => new Variable(),
        onSaved: (src: Variable, opts: Variable[]) => {
          const tgt = opts.find(v => v.key === src.key)
          if (src.key && tgt) {
            Variable.copy(src, tgt)
          } else {
            opts.push(Variable.copy(src))
          }
        },
        onDeleted: (key: any, ipts: Variable[]) => {
          ipts.splice(
            ipts.findIndex(ipt => ipt.key === key),
            1
          )
        },
        delable: [new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' })],
        editable: true
      },
      deps: {
        label: '依赖',
        type: 'TagList',
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'subNode' })
        ],
        subProp: 'subTitle',
        flatItem: true,
        mapper: new Mapper({
          data: {
            type: 'ListSelect',
            height: 300,
            options: []
          }
        }),
        emitter: depEmitter,
        newFun: () => ({ data: [] }),
        onSaved: (form: any) => form,
        onAdded: (form: any, data: any) => {
          form.data = data
        }
      },
      code: {
        label: '代码',
        type: 'CodeEditor',
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'subNode' })
        ],
        maxRows: 6
      },
      isFun: {
        label: '函数式',
        desc: '如果是含子节点，则该函数不会执行，而是抛出一个函数名供其后调用',
        placeholder: '函数式调用相对更加优雅，不会做输入输出的替换，代码也不会变化，推荐使用',
        type: 'Checkbox',
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'condNode' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ],
        onChange: (node: Node, checked: boolean) => {
          if (node.ntype === 'subNode') {
            nodeEmitter.emit('update:mprop', {
              'advanced.items.subFun.display': checked,
              'advanced.items.subFun.rules[0].required': checked
            })
          }
        }
      },
      subFun: {
        label: '函数名',
        type: 'Input',
        placeholder: '',
        display: true,
        rules: [
          { required: true, message: '必须指定函数名！' }
        ]
      },
      isAwait: {
        label: '异步节点',
        type: 'Checkbox',
        placeholder: '为真则会添加async/await前缀',
        display: {
          OR: [
            new Cond({ key: 'ntype', cmp: '=', val: 'traversal' }),
            new Cond({ key: 'ntype', cmp: '=', val: 'subNode' })
          ]
        }
      },
      isForIn: {
        label: '是否使用for……in循环',
        desc: '默认for……of循环',
        type: 'Checkbox',
        display: [new Cond({ key: 'ntype', cmp: '=', val: 'traversal' })]
      }
    }
  },
  previous: {
    label: '父节点',
    type: 'Text',
    display: false
  },
  subFlow: {
    label: '子流程',
    type: 'Button',
    display: [
      new Cond({ key: 'key', cmp: '!=', val: '' }),
      new Cond({ key: 'ntype', cmp: '=', val: 'subNode' })
    ],
    inner: '流程设计',
    onClick: async (node: Node) => {
      await store.dispatch('service/setSubNid', node.key)
      nodeEmitter.emit('update:show', false)
    }
  },
  delete: {
    label: '操作',
    type: 'Button',
    display: [
      new Cond({ key: 'key', cmp: '!=', val: '' }),
      new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
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
          await api.remove(node.key)
          nodeEmitter.emit('delNode', node.key)
          nodeEmitter.emit('update:show', false)
        }
      })
    }
  }
})

export const CardMinHgt = 86
export const CardWidth = 300
export const CardHeight = 108
export const CardHlfWid = CardWidth >> 1
export const ArrowHeight = 80
export const ArrowHlfHgt = ArrowHeight >> 1
export const AddBtnWH = 32
export const AddBtnHlfWH = AddBtnWH >> 1
export const CardGutter = 50
export const CardHlfGutter = CardGutter >> 1
export const StokeColor = '#f0f0f0'
