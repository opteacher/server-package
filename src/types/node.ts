/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
export default class Node implements Record<string, any> {
  key: string
  isTemp: boolean
  group: string
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
    this.isTemp = false
    this.group = ''
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
    this.isTemp = false
    this.group = ''
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
    tgt = tgt || new Node()
    tgt.key = force ? src.key || src._id : src.key || src._id || tgt.key
    tgt.isTemp = typeof src.isTemp !== 'undefined' ? src.isTemp : force ? false : tgt.isTemp
    tgt.group = force ? src.group : src.group || tgt.group
    tgt.title = force ? src.title : src.title || tgt.title
    tgt.desc = force ? src.desc : src.desc || tgt.desc
    tgt.ntype = force ? src.ntype : src.ntype || tgt.ntype
    if (src.inputs instanceof Array) {
      tgt.inputs = src.inputs.map((ipt: any) => Variable.copy(ipt))
    } else if (force) {
      tgt.inputs = []
    }
    if (src.outputs instanceof Array) {
      tgt.outputs = src.outputs.map((opt: any) => Variable.copy(opt))
    } else if (force) {
      tgt.outputs = []
    }
    tgt.code = force ? src.code : src.code || tgt.code
    tgt.isFun = typeof src.isFun !== 'undefined' ? src.isFun : force ? true : tgt.isFun
    tgt.previous = src.previous
      ? src.previous.key || src.previous._id || src.previous
      : force
      ? null
      : tgt.previous
    if (src.nexts instanceof Array) {
      tgt.nexts = src.nexts.map((nxt: any) => nxt.key || nxt._id || nxt)
    } else if (force) {
      tgt.nexts = []
    }
    tgt.relative = force ? src.relative : src.relative || tgt.relative
    tgt.temp = src.temp || (force ? [] : tgt.temp)
    if (src.deps instanceof Array) {
      tgt.deps = src.deps.map((dep: any) => dep.key || dep._id || dep)
    } else if (force) {
      tgt.deps = []
    }
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
