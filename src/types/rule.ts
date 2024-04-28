/* eslint-disable @typescript-eslint/no-explicit-any */

import { gnlCpy } from '@/utils'
import { Method } from './service'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const authValues = {
  '/': '匹配全路径，e.g: /api/v1/project',
  s: '匹配路径下所有项，e.g: /api/v1/project/s',
  ':i': '匹配路径下指定项，e.g: /api/v1/project/1',
  '*': '匹配路径下一级子路径，e.g: /api/v1/project/1$',
  '*/*': '匹配路径多级子路径，e.g: /api/v1/project/1/2/3'
}
export default class Rule {
  key: string
  method: Method | 'ALL'
  path: string
  value: string
  idens: { model: string; pKey: string; pVal: string }[]
  action: string
  remark: string

  constructor() {
    this.key = ''
    this.method = 'ALL'
    this.path = ''
    this.value = '*/*'
    this.idens = []
    this.action = ''
    this.remark = ''
  }

  reset() {
    this.key = ''
    this.method = 'ALL'
    this.path = ''
    this.value = '*/*'
    this.idens = []
    this.action = ''
    this.remark = ''
  }

  static copy(src: any, tgt?: Rule, force = false): Rule {
    return gnlCpy(Rule, src, tgt, { force })
  }
}
