/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Admin {
  key: string
  name: string
  password: string
  repeatPwd: string
  code: string
  mode: '登录' | '注册'

  constructor() {
    this.key = ''
    this.name = ''
    this.password = ''
    this.repeatPwd = ''
    this.code = ''
    this.mode = '登录'
  }

  static copy(src: any, tgt?: Admin): Admin {
    tgt = tgt || new Admin()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.password = src.password || tgt.password
    tgt.repeatPwd = src.repeatPwd || tgt.repeatPwd
    tgt.code = src.code || tgt.code
    tgt.mode = src.mode || tgt.mode
    return tgt
  }
}
