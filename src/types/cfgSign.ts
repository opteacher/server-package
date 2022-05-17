import Sign from './sgnProp'

export default class CfgSign {
  mode: 'simple' | 'complex'
  cmpProps: Sign[]

  constructor() {
    this.mode = 'simple'
    this.cmpProps = []
  }

  static copy(src: any, tgt?: CfgSign): CfgSign {
    tgt = tgt || new CfgSign()
    tgt.mode = src.mode || tgt.mode
    tgt.cmpProps = src.props || src.cmpProps || tgt.cmpProps
    return tgt
  }
}
