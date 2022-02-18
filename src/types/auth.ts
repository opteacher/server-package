/* eslint-disable @typescript-eslint/no-explicit-any */

import API from './api'
import Role from './role'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Auth {
  key: string
  model: string
  skips: string[]
  props: { key: string; name: string; alg: string }[]
  roles: Role[]
  apis: API[]

  constructor() {
    this.key = ''
    this.model = ''
    this.skips = []
    this.props = []
    this.roles = []
    this.apis = []
  }

  reset() {
    this.key = ''
    this.model = ''
    this.skips = []
    this.props = []
    this.roles = []
    this.apis = []
  }

  static copy(src: any, tgt?: Auth): Auth {
    tgt = tgt || new Auth()
    tgt.key = src.key || src._id || tgt.key
    tgt.model = src.model || tgt.model
    tgt.skips = src.skips || tgt.skips
    tgt.props = src.props || tgt.props
    tgt.roles = src.roles ? src.roles.map((role: any) => Role.copy(role)) : tgt.roles
    tgt.apis = src.apis ? src.apis.map((api: any) => API.copy(api)) : tgt.apis
    return tgt
  }
}
