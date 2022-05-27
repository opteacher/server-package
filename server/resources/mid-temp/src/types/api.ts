/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default class API {
  key: string
  name: string
  func: string
  model: string
  method: string
  path: string
  roles: string[]
  flow: string

  constructor() {
    this.key = ''
    this.name = ''
    this.func = ''
    this.model = ''
    this.method = 'GET'
    this.path = ''
    this.roles = []
    this.flow = ''
  }

  static copy(src: any, tgt?: API): API {
    tgt = tgt || new API()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.func = src.func || tgt.func
    tgt.model = src.model || tgt.model
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.roles = src.roles || tgt.roles
    tgt.flow = src.flow || tgt.flow
    return tgt
  }
}
