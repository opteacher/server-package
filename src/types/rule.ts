/* eslint-disable @typescript-eslint/no-explicit-any */

import { Method } from "./service"

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const authValues = {
  '/': '匹配全路径，e.g: /server-package/api/v1/project/64cb46313aa8c1c4562e4e2b',
  's': '匹配路径下所有项，e.g: /server-package/api/v1/project/s',
  ':i': '匹配路径下指定项，e.g: /server-package/api/v1/project/:iden',
  '*': '匹配路径下一级子路径，e.g: /server-package/api/v1/project/?',
  '*/*': '匹配路径多级子路径，e.g: /server-package/api/v1/project/*'
}
export default class Rule {
  key: string
  method: Method | 'ALL'
  path: string
  value: string
  idens: { model: string, pKey: string, pVal: string }[]
  action: string

  constructor() {
    this.key = ''
    this.method = 'ALL'
    this.path = ''
    this.value = '*/*'
    this.idens = []
    this.action = ''
  }

  reset() {
    this.key = ''
    this.method = 'ALL'
    this.path = ''
    this.value = '*/*'
    this.idens = []
    this.action = ''
  }

  static copy(src: any, tgt?: Rule): Rule {
    tgt = tgt || new Rule()
    tgt.key = src.key || src._id || tgt.key
    tgt.method = src.method || tgt.method
    tgt.path = src.path || tgt.path
    tgt.value = src.value || tgt.value
    tgt.idens = src.idens || tgt.idens
    tgt.action = src.action || tgt.action
    return tgt
  }
}
