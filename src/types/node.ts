/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { gnlCpy } from '@/utils'
import Variable from './variable'

export type NodeType = 'normal' | 'condition' | 'condNode' | 'traversal' | 'endNode' | 'subNode'
export type LoopType = 'for-of' | 'for-in'

export const NodeTypeMapper = {
  normal: '普通节点',
  condition: '条件根节点',
  condNode: '条件节点',
  traversal: '遍历节点',
  endNode: '结束节点',
  subNode: '子节点'
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
  subFun: string
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
    this.subFun = ''
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
    this.subFun = ''
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
    this.deps = []
    this.loop.isAwait = false
    this.loop.isForIn = false
  }

  static copy(src: any, tgt?: Node, force = false): Node {
    tgt = gnlCpy(Node, src, tgt, {
      force,
      ignProps: ['previous', 'loop', 'deps'],
      cpyMapper: { inputs: Variable.copy, outputs: Variable.copy }
    })
    if (src.deps) {
      tgt.deps = src.deps.map((dep: any) => dep.key || dep._id || dep)
    } else if (force) {
      tgt.deps = []
    }
    tgt.previous = src.previous
      ? src.previous.key || src.previous._id || src.previous
      : force
      ? null
      : tgt.previous
    tgt.nexts = tgt.nexts.map((next: any) => next._id || next)
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
