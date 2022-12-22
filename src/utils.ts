/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { message } from 'ant-design-vue'
import axios, { AxiosRequestConfig } from 'axios'
import store from '@/store'
import Service from './types/service'
import Property from './types/property'
import qs from 'qs'

export interface RequestOptions {
  project?: string
  type?: string
  middles?: {
    before?: () => void
    after?: (resp: any) => void
  }
  messages?: {
    notShow?: boolean
    loading?: string
    succeed?: string
    failed?: string
  }
  ignores?: string[]
  axiosConfig?: AxiosRequestConfig<any>
  copy?: (src: any, tgt?: any) => any
  orgRes?: boolean
}

export async function makeRequest(pms: Promise<any>, options?: RequestOptions): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.middles) {
    options.middles = {}
  }
  if (!options.messages) {
    options.messages = {}
  }
  options.middles.before && options.middles.before()
  if (!options.messages.notShow) {
    message.loading(options.messages.loading || '加载中……')
  }
  let resp = await pms
  if (!options.orgRes) {
    resp = resp.data
  }
  if (!options.messages.notShow) {
    message.destroy()
  }
  options.middles.after && options.middles.after(resp)
  let result = resp
  if (options.orgRes) {
    result = resp
  } else if (typeof resp.result !== 'undefined') {
    result = resp.result
  } else if (typeof resp.data !== 'undefined') {
    result = resp.data
  }
  if (resp.error || result.error) {
    if (!options.messages.notShow && options.messages.failed) {
      message.error(options.messages.failed)
    } else {
      message.error(resp.error || result.error)
    }
  } else {
    if (!options.messages.notShow && options.messages.succeed) {
      message.success(options.messages.succeed)
    } else if (result.message) {
      message.success(result.message)
    }
  }
  return Promise.resolve(result)
}

function reqType(options?: RequestOptions): string {
  return options && options.type ? options.type : 'mdl'
}

export async function reqAll(path: string, options?: RequestOptions): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.project) {
    options.project = 'server-package'
  }
  if (typeof options.orgRes === 'undefined') {
    options.orgRes = false
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options.messages.loading) {
    options.messages.loading = '查询中……'
  }
  if (!options.messages.succeed) {
    options.messages.succeed = '查询成功！'
  }
  const result = await makeRequest(
    axios.get(
      `/${options.project}/${reqType(options)}/v1/${path}/s`,
      options.axiosConfig && options.axiosConfig.params
        ? Object.assign(options.axiosConfig, {
            paramsSerializer: (params: any) => qs.stringify(params, { indices: false })
          })
        : undefined
    ),
    options
  )
  return result.map((item: any) => (options && options.copy ? options.copy(item) : item))
}

export async function reqGet(path: string, iden?: any, options?: RequestOptions): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.project) {
    options.project = 'server-package'
  }
  if (typeof options.orgRes === 'undefined') {
    options.orgRes = false
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options.messages.loading) {
    options.messages.loading = '查询中……'
  }
  if (!options.messages.succeed) {
    options.messages.succeed = '查询成功！'
  }
  const result = await makeRequest(
    axios.get(
      `/${options.project}/${reqType(options)}/v1/${path}${iden ? '/' + iden : ''}`,
      options.axiosConfig && options.axiosConfig.params
        ? Object.assign(options.axiosConfig, {
            paramsSerializer: (params: any) => qs.stringify(params, { indices: false })
          })
        : undefined
    ),
    options
  )
  return options && options.copy ? options.copy(result) : result
}

export function reqPost(path: string, body?: any, options?: RequestOptions): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.project) {
    options.project = 'server-package'
  }
  if (typeof options.orgRes === 'undefined') {
    options.orgRes = false
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options.messages.loading) {
    options.messages.loading = '提交中……'
  }
  if (!options.messages.succeed) {
    options.messages.succeed = '提交成功！'
  }
  if (!options.ignores) {
    options.ignores = ['key']
  } else if (!options.ignores.includes('key')) {
    options.ignores.push('key')
  }
  return makeRequest(
    axios.post(
      `/${options.project}/${reqType(options)}/v1/${path}`,
      body ? pickOrIgnore(body, options.ignores) : undefined,
      options.axiosConfig
    ),
    options
  )
}

export function reqDelete(path: string, iden: any, options?: RequestOptions): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.project) {
    options.project = 'server-package'
  }
  if (typeof options.orgRes === 'undefined') {
    options.orgRes = false
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options.messages.loading) {
    options.messages.loading = '删除中……'
  }
  if (!options.messages.succeed) {
    options.messages.succeed = '删除成功！'
  }
  return makeRequest(
    axios.delete(
      `/${options.project}/${reqType(options)}/v1/${path}/${iden}`,
      options.axiosConfig && options.axiosConfig.params
        ? Object.assign(options.axiosConfig, {
            paramsSerializer: (params: any) => qs.stringify(params, { indices: false })
          })
        : undefined
    ),
    options
  )
}

export function reqPut(
  path: string,
  iden: any,
  body?: any,
  options?: RequestOptions
): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.project) {
    options.project = 'server-package'
  }
  if (typeof options.orgRes === 'undefined') {
    options.orgRes = false
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options.messages.loading) {
    options.messages.loading = '提交中……'
  }
  if (!options.messages.succeed) {
    options.messages.succeed = '提交成功！'
  }
  if (!options.ignores) {
    options.ignores = ['key']
  } else if (!options.ignores.includes('key')) {
    options.ignores.push('key')
  }
  return makeRequest(
    axios.put(
      `/${options.project}/${reqType(options)}/v1/${path}/${iden}`,
      body ? pickOrIgnore(body, options.ignores) : undefined,
      options.axiosConfig
    ),
    options
  )
}

export function reqLink(
  body: {
    parent: [string, any]
    child: [string, any]
  },
  link = true,
  options?: RequestOptions
): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.project) {
    options.project = 'server-package'
  }
  if (typeof options.orgRes === 'undefined') {
    options.orgRes = false
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options.messages.loading) {
    options.messages.loading = '提交中……'
  }
  if (!options.messages.succeed) {
    options.messages.succeed = '提交成功！'
  }
  const url = [
    `/${options.project}/${reqType(options)}/v1`,
    body.parent[0],
    body.parent[1],
    body.child[0],
    body.child[1]
  ].join('/')
  if (link) {
    return makeRequest(axios.put(url, options.axiosConfig), options)
  } else {
    return makeRequest(axios.delete(url, options.axiosConfig), options)
  }
}

export function getProperty(obj: any, props: string | string[]): any {
  if (typeof props === 'string') {
    props = props.split('.')
  }
  for (const prop of props) {
    if (!obj) {
      return null
    } else if (obj instanceof Array && prop.startsWith('[') && prop.endsWith(']')) {
      const key = prop.substring(1, prop.length - 1)
      obj = obj.find(el => el.key === key)
    } else if (prop in obj) {
      obj = obj[prop]
    } else {
      return null
    }
  }
  return obj
}

export function pickOrIgnore(obj: { [key: string]: any }, attrs: string[], ignore = true): any {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => (ignore ? !attrs.includes(key) : attrs.includes(key)))
  )
}

export async function until(cdFun: () => Promise<boolean>, lpLimit = 500) {
  for (let i = 0; i < lpLimit; ++i) {
    if (await cdFun()) {
      return Promise.resolve()
    }
    await new Promise(res => setTimeout(res, 200))
  }
  return Promise.reject()
}

export async function waitFor(
  iden: string,
  options: {
    reqFun?: (el: any) => boolean
    loop?: number
    getBy?: 'id' | 'name'
  } = {}
): Promise<HTMLElement | null> {
  if (!options.reqFun) {
    options.reqFun = () => true
  }
  if (!options.loop) {
    options.loop = 500
  }
  if (!options.getBy) {
    options.getBy = 'id'
  }
  let ret = null
  for (let i = 0; i < options.loop; ++i) {
    if (options.getBy === 'id') {
      ret = document.getElementById(iden)
    } else if (options.getBy === 'name') {
      const eles = document.getElementsByName(iden)
      if (!eles || !eles.length) {
        await new Promise(res => setTimeout(res, 200))
        continue
      } else {
        ret = eles[0]
      }
    }
    if (ret) {
      if (options.reqFun(ret)) {
        return Promise.resolve(ret)
      }
    }
    await new Promise(res => setTimeout(res, 200))
  }
  return Promise.resolve(ret)
}

export function fixStartsWith(text: string, prefix: string) {
  return (text.substring(0, prefix.length) !== prefix ? prefix : '') + text
}

export function endsWith(text: string, suffix: string) {
  return text.toString().slice(-suffix.length) === suffix
}

export function genMdlPath(svc: Service): string {
  const model = store.getters['model/ins']
  const relProp = model.props.find((prop: Property) => prop.relative && prop.relative.model)
  const mname = model.name
  switch (svc.method) {
    case 'LINK':
      return relProp ? `/mdl/v1/${mname}/:index/${relProp.name}/:propIdx` : ''
    case 'POST':
      return `/mdl/v1/${mname}`
    case 'DELETE':
    case 'PUT':
    case 'GET':
      return `/mdl/v1/${mname}/:index`
    default:
      return ''
  }
}

export function intervalCheck(options: {
  chkFun: () => Promise<boolean>
  middle?: {
    waiting?: (countdown: number) => void
    failed?: () => void
    succeed?: () => void
  }
  interval?: number
  limit?: number
}) {
  let countdown = 0
  const func = async (options: {
    chkFun: () => Promise<boolean>
    middle?: {
      waiting?: (countdown: number) => void
      failed?: () => void
      succeed?: () => void
    }
    limit?: number
  }) => {
    if (!options.middle) {
      options.middle = {}
    }
    if (!options.middle.waiting) {
      options.middle.waiting = () => {
        console.log()
      }
    }
    if (!options.middle.failed) {
      options.middle.failed = () => {
        console.log()
      }
    }
    if (!options.middle.succeed) {
      options.middle.succeed = () => {
        console.log()
      }
    }
    if (!options.limit) {
      options.limit = 60
    }
    if (!(await options.chkFun())) {
      // 检查状态不满足要求
      options.middle.waiting(countdown)
      if (countdown > (options.limit || 60)) {
        // 如果超过等待极限时间，告知
        options.middle.failed()
        clearInterval(h)
      } else {
        ++countdown
      }
      return
    }
    clearInterval(h)
    // 状态满足要求，告知
    options.middle.succeed()
  }
  const h = setInterval(() => func(options), options.interval || 1000)
  setTimeout(() => func(options), 200)
}

export function fmtStrByObj(pattern: RegExp, obj: any, str: string) {
  let ret = str
  for (let result = pattern.exec(str); result; result = pattern.exec(str)) {
    ret = ret.replace(
      result[0] + ' ',
      getProperty(obj, result[0].substring(result[0].startsWith('@') ? 1 : 2))
    )
  }
  return ret
}

export function upperFirst(text: string): string {
  if (!text.length) {
    return ''
  }
  const char = text.charCodeAt(0)
  if (char >= 97 && char <= 122) {
    return String.fromCharCode(char - 32) + text.substring(1)
  }
  return text
}

export function lowerFirst(text: string): string {
  if (!text.length) {
    return ''
  }
  const char = text.charCodeAt(0)
  if (char >= 65 && char <= 90) {
    return String.fromCharCode(char + 32) + text.substring(1)
  }
  return text
}
