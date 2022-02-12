/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Variable from './variable.js'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type NodeType = 'normal' | 'condition' | 'condNode' | 'traversal' | 'endNode'
export type LoopType = 'for-of' | 'for-in'

export const loopTypes = ['for-of', 'for-in']

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
  type: NodeType
  loop: LoopType
  inputs: Variable[] // [0]参数 [1]槽
  outputs: Variable[]
  isFun: boolean
  code: string
  previous: string | null
  nexts: string[]
  relative: string
  temp: string[]

  constructor() {
    this.key = ''
    this.isTemp = false
    this.group = ''
    this.title = ''
    this.desc = ''
    this.type = 'normal'
    this.loop = 'for-of'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.isFun = true
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
  }

  reset() {
    this.key = ''
    this.isTemp = false
    this.group = ''
    this.title = ''
    this.desc = ''
    this.type = 'normal'
    this.loop = 'for-of'
    this.inputs = []
    this.outputs = []
    this.code = ''
    this.isFun = true
    this.previous = null
    this.nexts = []
    this.relative = ''
    this.temp = []
  }

  static copy(src: any, tgt?: Node): Node {
    tgt = tgt || new Node()
    tgt.key = src.key || src._id || tgt.key
    tgt.isTemp = typeof src.isTemp !== 'undefined' ? src.isTemp : tgt.isTemp
    tgt.group = src.group || tgt.group
    tgt.title = src.title || tgt.title
    tgt.desc = src.desc || tgt.desc
    tgt.type = src.type || tgt.type
    tgt.loop = src.loop || tgt.loop
    if (typeof src.inputs !== 'undefined') {
      tgt.inputs = src.inputs.map((ipt: any) => Variable.copy(ipt))
    }
    if (typeof src.outputs !== 'undefined') {
      tgt.outputs = src.outputs.map((opt: any) => Variable.copy(opt))
    }
    tgt.code = src.code || tgt.code
    tgt.isFun = typeof src.isFun !== 'undefined' ? src.isFun : tgt.isFun
    if (src.previous) {
      tgt.previous = src.previous.key || src.previous._id || src.previous
    }
    tgt.nexts =
      src.nexts && src.nexts.length
        ? src.nexts.map((nxt: any) => nxt.key || nxt._id || nxt)
        : tgt.nexts
    tgt.relative = src.relative || tgt.relative
    tgt.temp = src.temp || tgt.temp
    return tgt
  }
}
