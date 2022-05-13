import { ArrowHlfHgt } from '@/views/Flow'
import Node from './node'

export default class NodeInPnl extends Node {
  posLT: [number, number]
  size: [number, number]
  btmSvgHgt: number

  constructor() {
    super()
    this.posLT = [0, 0]
    this.size = [0, 0]
    this.btmSvgHgt = ArrowHlfHgt
  }

  static copy(src: any, tgt?: NodeInPnl): NodeInPnl {
    tgt = tgt || new NodeInPnl()
    Node.copy(src, tgt)
    if (src.posLT && src.posLT.length === 2) {
      tgt.posLT[0] = src.posLT[0]
      tgt.posLT[1] = src.posLT[1]
    }
    if (src.size && src.size.length === 2) {
      tgt.size[0] = src.size[0]
      tgt.size[1] = src.size[1]
    }
    tgt.btmSvgHgt = src.btmSvgHgt || tgt.btmSvgHgt
    return tgt
  }
}
