/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default class API {
  key: string
  model: string
  method: string
  path: string
  roles: string[]

  constructor() {
    this.key = ''
    this.model = ''
    this.method = 'GET'
    this.path = ''
    this.roles = []
  }

  static copy(src: any, tgt?: API): API {
    tgt = tgt || new API()
    tgt.key = src.key || src._id || tgt.key
    tgt.model = src.model || tgt.model
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.roles = src.roles || tgt.roles
    return tgt
  }
}
