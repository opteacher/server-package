/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { gnlCpy } from '@/utils'
import Variable from './variable'

export type NodeType = 'normal' | 'condition' | 'condNode' | 'traversal' | 'endNode'
export type LoopType = 'for-of' | 'for-in'

export const NodeTypeMapper = {
  normal: '普通节点',
  condition: '条件根节点',
  condNode: '条件节点',
  traversal: '遍历节点',
  endNode: '结束节点'
}

export const ndTpOpns = Object.entries(NodeTypeMapper).map(([value, label]) => ({ label, value }))

export default class Node implements Record<string, any> {
  key: string
  title: string
  desc: string
  ntype: NodeType
  inputs: Variable[] // [0]参数 [1]槽
  outputs: Variable[]
  isFun: boolean
  code: string
  previous: string | null
  nexts: string[]
  relative: string
  temp: string[]
  deps: string[]
  loop: {
    isAwait: boolean
    isForIn: boolean
  }

  constructor() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.ntype = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.isFun = true
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
    this.deps = []
    this.loop = {
      isAwait: false,
      isForIn: false
    }
  }

  reset() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.ntype = 'normal'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.isFun = true
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
    this.deps = []
    this.loop.isAwait = false
    this.loop.isForIn = false
  }

  static copy(src: any, tgt?: Node, force = false): Node {
    const gen = gnlCpy(Node, src, tgt, {
      force,
      ignProps: ['previous', 'loop'],
      cpyMapper: { inputs: Variable.copy, outputs: Variable.copy }
    })
    if (!tgt) {
      tgt = gen
    }
    tgt.previous = src.previous
      ? src.previous.key || src.previous._id || src.previous
      : force
      ? null
      : tgt.previous
    if (src.ntype === 'traversal') {
      if (src.loop) {
        tgt.loop.isAwait =
          typeof src.loop.isAwait !== 'undefined' ? src.loop.isAwait : tgt.loop.isAwait
        tgt.loop.isForIn =
          typeof src.loop.isForIn !== 'undefined' ? src.loop.isForIn : tgt.loop.isForIn
      } else if (force) {
        tgt.loop.isAwait = false
        tgt.loop.isForIn = false
      }
    }
    return tgt
  }
}
