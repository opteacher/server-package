/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import DepType from './dep'
import Variable from './variable'

/* eslint-disable @typescript-eslint/no-explicit-any */
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
  deps: DepType[]

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
  }

  static copy(src: any, tgt?: Node): Node {
    tgt = tgt || new Node()
    tgt.key = src.key || src._id || tgt.key
    tgt.isTemp = typeof src.isTemp !== 'undefined' ? src.isTemp : tgt.isTemp
    tgt.group = src.group || tgt.group
    tgt.title = src.title || tgt.title
    tgt.desc = src.desc || tgt.desc
    tgt.ntype = src.ntype || tgt.ntype
    if (src.inputs instanceof Array) {
      tgt.inputs = src.inputs.map((ipt: any) => Variable.copy(ipt))
    }
    if (src.outputs instanceof Array) {
      tgt.outputs = src.outputs.map((opt: any) => Variable.copy(opt))
    }
    tgt.code = src.code || tgt.code
    tgt.isFun = typeof src.isFun !== 'undefined' ? src.isFun : tgt.isFun
    tgt.previous = src.previous
      ? src.previous.key || src.previous._id || src.previous
      : tgt.previous
    if (src.nexts instanceof Array) {
      tgt.nexts = src.nexts.map((nxt: any) => nxt.key || nxt._id || nxt)
    }
    tgt.relative = src.relative || tgt.relative
    tgt.temp = src.temp || tgt.temp
    tgt.deps = src.deps ? src.deps.map((dep: any) => DepType.copy(dep)) : []
    return tgt
  }
}
