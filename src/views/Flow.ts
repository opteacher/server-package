/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import store from '@/store'
import { NodesInPnl } from '@/store/service'
import { Cond, baseTypes, bsTpOpns } from '@/types'
import NodeInPnl from '@/types/ndInPnl'
import Node, { NodeType } from '@/types/node'
import Variable from '@/types/variable'
import { setProp, until } from '@/utils'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { Moment } from 'moment'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { createVNode, ref } from 'vue'

import { ndAPI as api, depAPI } from '../apis'

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
  return [Variable.copy({ key: 'context', name: 'ctx', type: 'Object' })]
    .concat(incSelf ? node.outputs : [])
    .concat(node.previous ? scanLocVars(node.previous) : [])
}

const iptEmitter = new Emitter()

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
          iptMapper['value'].options = getLocVars().map((locVar: Variable) => ({
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
      if (input.vtype !== 'Object' && input.vtype !== 'Unknown') {
        return
      }
      const edtNode = store.getters['service/editNode']
      const pvsNode = store.getters['service/node'](edtNode.previous)
      const selVar = pvsNode
        ? getLocVars(pvsNode, pvsNode.nexts.length).find(
            (v: any) => v.value === to || v.name === to
          )
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
    type: 'Input'
  }
})

const optEmitter = new Emitter()

export const edtNdEmitter = new Emitter()

edtNdEmitter.on('update:show', async (show: boolean) => {
  if (!show) {
    return
  }
  const deps = await depAPI.all()
  setProp(
    edtNdMapper,
    'advanced.items.deps.lblMapper',
    Object.fromEntries(deps.map(dep => [dep.key, dep.name]))
  )
  setProp(
    edtNdMapper,
    'advanced.items.deps.mapper.data.options',
    deps.map(dep => ({
      key: dep.key,
      title: dep.name,
      subTitle: [
        'import ',
        dep.default ? dep.exports[0] : `{ ${dep.exports.join(', ')} }`,
        ` from '${dep.from}'`
      ].join('')
    }))
  )
  edtNdEmitter.emit('update:mapper', edtNdMapper)
})

const depEmitter = new Emitter()

export const edtNdMapper = new Mapper({
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
        emitter: iptEmitter,
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
            options = getLocVars(pvsNode, pvsNode.nexts.length).map((locVar: Variable) => ({
              label: locVar.value || locVar.name,
              value: locVar.value || locVar.name
            }))
          } else {
            options = [{ label: 'ctx', value: 'ctx' }]
          }
          edtNdEmitter.emit('update:mprop', {
            'advanced.items.inputs.mapper.value.options': options
          })
        },
        onSaved: (src: Variable, ipts: Variable[]) => {
          const tgt = ipts.find(v => v.key === src.key)
          if (src.key && tgt) {
            Variable.copy(src, tgt)
          } else {
            ipts.push(Variable.copy(src))
          }
        },
        addable: [new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' })],
        delable: [new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' })]
      },
      outputs: {
        label: '输出',
        type: 'Table',
        emitter: optEmitter,
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'condNode' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
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
        delable: [new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' })]
      },
      deps: {
        label: '依赖',
        type: 'TagList',
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ],
        subProp: 'subTitle',
        mapper: new Mapper({
          data: {
            label: '可用模组',
            type: 'ListSelect',
            height: 300,
            options: []
          }
        }),
        emitter: depEmitter,
        newFun: () => ({ data: [] }),
        onSaved: (form: any) => {
          edtNdEmitter.emit(
            'update:data',
            setProp(store.getters['service/editNode'], 'deps', form.data)
          )
        }
      },
      code: {
        label: '代码',
        type: 'CodeEditor',
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ],
        maxRows: 6
      },
      isFun: {
        label: '函数式',
        desc: '函数式调用相对更加优雅，不会做输入输出的替换，代码也不会变化，推荐使用',
        type: 'Checkbox',
        display: [
          new Cond({ key: 'ntype', cmp: '!=', val: 'condition' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'traversal' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'condNode' }),
          new Cond({ key: 'ntype', cmp: '!=', val: 'endNode' })
        ]
      },
      'loop.isAwait': {
        label: '是否为await',
        type: 'Checkbox',
        display: [new Cond({ key: 'ntype', cmp: '=', val: 'traversal' })]
      },
      'loop.isForIn': {
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
          edtNdEmitter.emit('update:show', false)
        }
      })
    }
  }
})

export const CardMinHgt = 86
export const CardWidth = 300
export const CardHlfWid = CardWidth >> 1
export const ArrowHeight = 80
export const ArrowHlfHgt = ArrowHeight >> 1
export const AddBtnWH = 32
export const AddBtnHlfWH = AddBtnWH >> 1
export const CardGutter = 50
export const CardHlfGutter = CardGutter >> 1
export const StokeColor = '#f0f0f0'

export async function buildNodes(ndKey: string, height: number) {
  const ndMapper = store.getters['service/nodes'] as NodesInPnl
  const node = ndMapper[ndKey]
  let domEle: null | HTMLElement = document.getElementById(ndKey)
  await until(() => {
    if (!domEle) {
      domEle = document.getElementById(ndKey)
    }
    return Promise.resolve(domEle !== null && domEle.clientWidth !== 0 && domEle.clientHeight !== 0)
  })
  if (domEle) {
    node.size[0] = domEle.clientWidth
    node.size[1] = domEle.clientHeight
    if (!node.previous) {
      node.posLT[0] = (store.getters['service/width'] >> 1) - CardHlfWid
      node.posLT[1] = height
    } else if (node.ntype === 'endNode') {
      const relNode = ndMapper[node.relative]
      node.posLT[0] = relNode.posLT[0]
      let maxHeight = 0
      const traverse = (node: NodeInPnl) => {
        if (node.key === ndKey) {
          return
        }
        const height = node.posLT[1] + node.size[1] + ArrowHeight
        maxHeight = height > maxHeight ? height : maxHeight
        for (const nxtKey of node.nexts) {
          traverse(ndMapper[nxtKey])
        }
      }
      traverse(relNode)
      node.posLT[1] = maxHeight
    } else {
      const pvsNode = ndMapper[node.previous]
      const nexts = pvsNode.nexts
      const oddLen = nexts.length % 2
      const pvsLft = ndMapper[pvsNode.key].posLT[0] + (oddLen ? 0 : CardHlfWid + CardHlfGutter)
      const index = nexts.indexOf(node.key)
      const midIdx = (nexts.length - (oddLen ? 1 : 0)) >> 1
      const idxDif = index - midIdx
      node.posLT[0] =
        pvsLft +
        // + (idxDif > 0 ? CardWidth : 0) //初始定位在中间节点的左边
        idxDif * (CardWidth + CardGutter) // 加上当前节点与中间节点的距离
      // - (idxDif > 0 ? CardWidth : 0) // 如果是右边的节点，则此时定位在节点的右边，调整到左边
      node.posLT[1] = height
    }
  }
  for (const nxtKey of node.nexts) {
    await buildNodes(nxtKey, node.posLT[1] + node.size[1] + ArrowHeight)
  }
}

export async function fixWidth() {
  let left = 0
  let right = 0
  for (const node of Object.values(store.getters['service/nodes'] as NodesInPnl)) {
    if (node.posLT[0] < left) {
      left = node.posLT[0]
    }
    if (node.posLT[0] + node.size[0] > right) {
      right = node.posLT[0] + node.size[0]
    }
  }
  if (store.getters['service/width'] < right - left) {
    store.commit('service/SET_WIDTH', right - left)
    await store.dispatch('service/refresh')
  }
}

export async function fillPlaceholder(key: string) {
  const ndMapper = store.getters['service/nodes']
  const node = ndMapper[key]
  for (const nxtKey of node.nexts) {
    const nxtNode = ndMapper[nxtKey]
    const height = nxtNode.posLT[1] - (node.posLT[1] + node.size[1])
    if (height > ArrowHeight) {
      node.btmSvgHgt = height - ArrowHlfHgt
    }
    await fillPlaceholder(nxtKey)
  }
}
