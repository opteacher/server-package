import { v4 as uuidv4 } from 'uuid'

export default class SgnProp {
  key: string
  name: string
  alg: 'none' | 'md5' | 'sha1' | 'sha256' | 'hmac' | 'base64'

  constructor() {
    this.key = ''
    this.name = ''
    this.alg = 'none'
  }

  static copy(src: any, tgt?: SgnProp): SgnProp {
    tgt = tgt || { key: uuidv4(), name: '', alg: 'none' }
    tgt.name = src.name || tgt.name
    tgt.alg = src.alg || tgt.alg
    return tgt
  }
}
