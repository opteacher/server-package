import Compo from "./compo"

export default class CmpIns {
  key: string
  ctype: string
  style: {
    width: string
    height: string
  } & Record<string, any>
  children: CmpIns[]

  constructor(compo?: Compo) {
    this.key = ''
    this.ctype = compo ? compo.name : ''
    this.style = {
      width: 'auto',
      height: 'auto'
    }
    this.children = []
  }

  reset() {
    this.key = ''
    this.ctype = ''
    this.style.width = 'auto'
    this.style.height = 'auto'
    this.children = []
  }

  static copy(src: any, tgt?: CmpIns): CmpIns {
    tgt = tgt || new CmpIns()
    tgt.key = src.key || src._id || tgt.key
    tgt.ctype = src.ctype || tgt.ctype
    if (src.style) {
      tgt.style.width = src.style.width || tgt.style.width
      tgt.style.height = src.style.height || tgt.style.height
    }
    tgt.children = src.children.length
      ? src.children.map((childCmp: any) => CmpIns.copy(childCmp))
      : tgt.children
    return tgt
  }
}
