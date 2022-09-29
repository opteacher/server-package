import CmpIns from './cmpIns'

export default class MidDsb {
  key: string
  bkgdColor: string
  padding: [number, number]
  children: CmpIns[]

  constructor() {
    this.key = ''
    this.bkgdColor = '#FFFFFF'
    this.padding = [16, 16]
    this.children = []
  }

  reset() {
    this.key = ''
    this.bkgdColor = '#FFFFFF'
    this.padding = [16, 16]
    this.children = []
  }

  static copy(src: any, tgt?: MidDsb, force = false) {
    tgt = tgt || new MidDsb()
    tgt.key = force ? src.key || src._id : src.key || src._id || tgt.key
    tgt.bkgdColor = force ? src.bkgdColor : src.bkgdColor || tgt.bkgdColor
    tgt.padding = force ? src.padding : src.padding || tgt.padding
    tgt.children = (src.children || (force ? [] : tgt.children)).map((subCmp: any) => CmpIns.copy(subCmp))
    return tgt
  }
}
