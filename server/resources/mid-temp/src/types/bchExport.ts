import Batch from './batch'

export type CmpTyp = '=' | '!=' | '>' | '<' | '>=' | '<='

export default class BchEpt extends Batch {
  filterCols: string[]
  ttlMap: Record<string, string>

  constructor() {
    super()
    this.filterCols = []
    this.ttlMap = {}
  }

  reset() {
    super.reset()
    this.filterCols = []
    this.ttlMap = {}
  }

  static copy(src: any, tgt?: BchEpt, force = false): BchEpt {
    tgt = tgt || new BchEpt()
    Batch.copy(src, tgt)
    tgt.filterCols = force ? src.filterCols : src.filterCols || tgt.filterCols
    tgt.ttlMap = force ? src.ttlMap : src.ttlMap || tgt.ttlMap
    return tgt
  }
}
