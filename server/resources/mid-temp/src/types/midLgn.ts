export default class MidLgn {
  key: string
  bkgdColor: string
  background: any[]
  lblWidth: number
  width: number
  align: string
  radius: number
  fmBkgdColor: string
  registerable: boolean
  title: string
  logAccount: boolean
  hasLabel: boolean

  constructor() {
    this.key = ''
    this.bkgdColor = '#cdcdcd'
    this.background = []
    this.lblWidth = 4
    this.width = 50
    this.align = 'center'
    this.radius = 0
    this.fmBkgdColor = '#EFEFEF'
    this.registerable = false
    this.title = '登录标题'
    this.logAccount = true
    this.hasLabel = true
  }

  reset() {
    this.key = ''
    this.bkgdColor = '#cdcdcd'
    this.background = []
    this.lblWidth = 4
    this.width = 50
    this.align = 'center'
    this.radius = 0
    this.fmBkgdColor = '#EFEFEF'
    this.registerable = false
    this.title = ''
    this.logAccount = true
    this.hasLabel = true
  }

  static copy(src: any, tgt?: MidLgn): MidLgn {
    tgt = tgt || new MidLgn()
    tgt.key = src.key || src._id || tgt.key
    tgt.bkgdColor = src.bkgdColor || tgt.bkgdColor
    tgt.background = src.background || tgt.background
    tgt.lblWidth = src.lblWidth || tgt.lblWidth
    tgt.width = src.width || tgt.width
    tgt.align = src.align || tgt.align
    tgt.radius = src.radius || tgt.radius
    tgt.fmBkgdColor = src.fmBkgdColor || tgt.fmBkgdColor
    tgt.registerable = typeof src.registerable !== 'undefined' ? src.registerable : tgt.registerable
    tgt.title = typeof src.title !== 'undefined' ? src.title : tgt.title
    tgt.logAccount = typeof src.logAccount !== 'undefined' ? src.logAccount : tgt.logAccount
    tgt.hasLabel = typeof src.hasLabel !== 'undefined' ? src.hasLabel : tgt.hasLabel
    return tgt
  }

  equals(to: any): boolean {
    return (
      this.bkgdColor === to.bkgdColor &&
      this.background === to.background &&
      this.lblWidth === to.lblWidth &&
      this.width === to.width &&
      this.align === to.align &&
      this.radius === to.radius &&
      this.fmBkgdColor === to.fmBkgdColor &&
      this.registerable === to.registerable &&
      this.title === to.title &&
      this.logAccount === to.logAccount &&
      this.hasLabel === to.hasLabel
    )
  }
}
