/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import store from '@/store'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Moment } from 'moment'
import Mapper from '@/types/mapper'
import { baseTypes, Cond } from '@/types'
import Variable from '@/types/variable'
import Node, { NodeType, NodeTypeMapper } from '@/types/node'
import Column from '@/types/column'
import { ndAPI as api } from '../apis'

const iptEmitter = new Emitter()

const iptMapper = new Mapper({
  name: {
    label: '参数名',
    type: 'Input'
  },
  vtype: {
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
          iptMapper['value'].prefix = '['
          iptMapper['value'].suffix = ']'
          input.value = ''
          break
        case 'Object':
          iptMapper['value'].type = 'Select'
          store.commit('service/UPD_EDT_LOCVARS')
          iptMapper['value'].options = store.getters['service/locVars'].map((locVar: Variable) => ({
            label: locVar.value || locVar.name,
            value: locVar.value || locVar.name
          }))
          input.value = ''
          input.prop = ''
          break
      }
      iptEmitter.emit('update:mapper', iptMapper)
    }
  },
  value: {
    label: '值',
    type: 'Select',
    options: [],
    onChange: (input: Variable, to: string) => {
      if (input.vtype !== 'Object') {
        return
      }
      const locVars = store.getters['service/locVars']
      const selVar = locVars.find((v: any) => v.value === to || v.name === to)
      input.vtype = selVar.vtype
    }
  },
  prop: {
    label: '对象值分量',
    desc: '如果还定义索引，则默认索引在前，分量在后（e.g: object[index].prop）',
    type: 'Input',
    display: [Cond.copy({ key: 'vtype', cmp: '==', val: 'Object' })]
  },
  index: {
    label: '索引',
    type: 'Input',
    display: {
      OR: [
        Cond.copy({ key: 'vtype', cmp: '==', val: 'Object' }),
        Cond.copy({ key: 'vtype', cmp: '==', val: 'Array' })
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
        Cond.copy({ key: 'vtype', cmp: '==', val: 'Object' }),
        Cond.copy({ key: 'vtype', cmp: '==', val: 'Array' })
      ]
    }
  },
  remark: {
    label: '备注',
    type: 'Input'
  }
})

export const edtNdEmitter = new Emitter()

export const edtNdMapper = new Mapper({
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
    display: [Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })]
  },
  desc: {
    label: '描述',
    type: 'Textarea',
    display: [Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })],
    maxRows: 2
  },
  ntype: {
    label: '类型',
    type: 'Select',
    options: Object.entries(NodeTypeMapper).map(([key, val]) => ({
      label: val,
      value: key
    })),
    onChange: (node: Node, to: NodeType) => {
      if (to === 'condNode') {
        node.isFun = false
      }
    }
  },
  advanced: {
    label: '开发者配置',
    type: 'Group',
    items: {
      inputs: {
        label: '输入',
        type: 'Table',
        show: false,
        emitter: iptEmitter,
        display: [
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'condition' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ],
        columns: [
          new Column('参数名', 'name'),
          new Column('参数类型', 'vtype'),
          new Column('传入变量', 'value'),
          new Column('变量分量', 'prop'),
          new Column('备注', 'remark')
        ],
        mapper: iptMapper,
        dsKey: '',
        copy: Variable.copy,
        onSaved: async (input: Variable, next: () => void) => {
          await api.inOutput.save({ name: 'inputs', varb: input })
          edtNdEmitter.emit('update:data', store.getters['service/editNode'])
          next()
        },
        onDeleted: async (key: string) => {
          await api.inOutput.remove({ name: 'inputs', key })
          edtNdEmitter.emit('update:data', store.getters['service/editNode'])
        },
        addable: [Cond.copy({ key: 'ntype', cmp: '!=', val: 'traversal' })],
        delable: [Cond.copy({ key: 'ntype', cmp: '!=', val: 'traversal' })]
      },
      outputs: {
        label: '输出',
        type: 'Table',
        show: false,
        display: [
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'condition' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'condNode' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })
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
        dsKey: '',
        copy: Variable.copy,
        onSaved: async (output: Variable, next: () => void) => {
          output.vtype = 'Object'
          await api.inOutput.save({ name: 'outputs', varb: output })
          edtNdEmitter.emit('update:data', store.getters['service/editNode'])
          next()
        },
        onDeleted: async (key: string) => {
          await api.inOutput.remove({ name: 'outputs', key })
          edtNdEmitter.emit('update:data', store.getters['service/editNode'])
        },
        delable: [Cond.copy({ key: 'ntype', cmp: '!=', val: 'traversal' })]
      },
      deps: {
        label: '依赖',
        type: 'ListSelect',
        display: [
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'condition' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ],
        options: []
      },
      code: {
        label: '代码',
        type: 'Textarea',
        display: [
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'condition' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'traversal' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ],
        maxRows: 6
      },
      isFun: {
        label: '是否为函数式',
        desc: '函数式调用相对更加优雅，不会做输入输出的替换，代码也不会变化，推荐使用',
        type: 'Checkbox',
        disabled: [Cond.copy({ key: 'ntype', cmp: '==', val: 'condNode' })],
        display: [
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'condition' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'traversal' }),
          Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ]
      }
    }
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
      Cond.copy({ key: 'ntype', cmp: '!=', val: 'condition' }),
      Cond.copy({ key: 'ntype', cmp: '!=', val: 'endNode' })
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
      await api.save({ key, group: '' })
      edtNdEmitter.emit('update:data', store.getters['service/editNode'])
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
          await api.remove(node.key)
          store.commit('service/RESET_NODE')
        }
      })
    }
  }
})

export const joinMapper = new Mapper({
  group: {
    label: '节点组',
    type: 'SelOrIpt',
    options: [],
    mode: 'select'
  }
})

export const CardMinHgt = 150
export const CardWidth = 300
export const CardHlfWid = CardWidth >> 1
export const ArrowHeight = 100
export const ArrowHlfHgt = ArrowHeight >> 1
export const AddBtnWH = 32
export const AddBtnHlfWH = AddBtnWH >> 1
export const CardGutter = 50
export const CardHlfGutter = CardGutter >> 1
