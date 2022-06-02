/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { message } from 'ant-design-vue'
import axios from 'axios'
import store from '@/store'
import Service from './types/service'

export interface RequestOptions {
  type?: string
  middles?: {
    before?: () => void
    after?: (resp: any) => void
  }
  messages?: {
    notShow?: boolean
    loading?: string
    succeed?: string
  }
  ignores?: string[]
  query?: any
  copy?: (src: any, tgt?: any) => any
}

export async function makeRequest(pms: Promise<any>, options?: RequestOptions): Promise<any> {
  options?.middles?.before && options?.middles?.before()
  if (!options?.messages?.notShow) {
    message.loading(options?.messages?.loading || '加载中……')
  }
  const resp = (await pms).data
  if (!options?.messages?.notShow) {
    message.destroy()
  }
  options?.middles?.after && options?.middles?.after(resp)
  if (!options?.messages?.notShow && options?.messages?.succeed) {
    message.success(options?.messages?.succeed)
  }
  return Promise.resolve(resp.result || resp.data)
}

function reqType(options?: RequestOptions): string {
  return options && options.type ? options.type : 'mdl'
}

export function reqAll(path: string, options?: RequestOptions): Promise<any> {
  return makeRequest(
    axios.get(`/server-package/${reqType(options)}/v1/${path}s`, { params: options?.query }),
    options
  ).then((result: any[]) =>
    result.map((item: any) => (options && options.copy ? options.copy(item) : item))
  )
}

export function reqGet(path: string, iden?: any, options?: RequestOptions): Promise<any> {
  return makeRequest(
    axios.get(`/server-package/${reqType(options)}/v1/${path}${iden ? '/' + iden : ''}`, {
      params: options?.query
    }),
    options
  ).then((result: any) => (options && options.copy ? options.copy(result) : result))
}

export function reqPost(path: string, body?: any, options?: RequestOptions): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options?.messages?.loading) {
    options.messages.loading = '提交中……'
  }
  if (!options?.messages?.succeed) {
    options.messages.succeed = '提交成功！'
  }
  if (!options.ignores) {
    options.ignores = ['key']
  } else if (!options.ignores.includes('key')) {
    options.ignores.push('key')
  }
  return makeRequest(
    axios.post(
      `/server-package/${reqType(options)}/v1/${path}`,
      body ? skipIgnores(body, options.ignores) : undefined,
      { params: options?.query }
    ),
    options
  )
}

export function reqDelete(path: string, iden: any, options?: RequestOptions): Promise<any> {
  if (!options) {
    options = {}
  }
  if (!options.messages) {
    options.messages = {}
  }
  if (!options?.messages?.loading) {
    options.messages.loading = '删除中……'
  }
  if (!options?.messages?.succeed) {
    options.messages.succeed = '删除成功！'
  }
  return makeRequest(
    axios.delete(`/server-package/${reqType(options)}/v1/${path}/${iden}`, {
      params: options?.query
    }),
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
  if (!options.messages) {
    options.messages = {}
  }
  if (!options?.messages?.loading) {
    options.messages.loading = '提交中……'
  }
  if (!options?.messages?.succeed) {
    options.messages.succeed = '提交成功！'
  }
  if (!options.ignores) {
    options.ignores = ['key']
  } else if (!options.ignores.includes('key')) {
    options.ignores.push('key')
  }
  return makeRequest(
    axios.put(
      `/server-package/${reqType(options)}/v1/${path}/${iden}`,
      body ? skipIgnores(body, options.ignores) : undefined,
      { params: options?.query }
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
  if (!options.messages) {
    options.messages = {}
  }
  if (!options?.messages?.loading) {
    options.messages.loading = '提交中……'
  }
  if (!options?.messages?.succeed) {
    options.messages.succeed = '提交成功！'
  }
  const url = [
    `/server-package/${reqType(options)}/v1`,
    body.parent[0],
    body.parent[1],
    body.child[0],
    body.child[1]
  ].join('/')
  if (link) {
    return makeRequest(axios.put(url, { params: options?.query }), options)
  } else {
    return makeRequest(axios.delete(url, { params: options?.query }), options)
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

export function skipIgnores(obj: { [key: string]: any }, ignores: string[]): any {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !ignores.includes(key)))
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
) {
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
      ret = document.getElementsByName(iden)
      if (!ret || !ret.length) {
        await new Promise(res => setTimeout(res, 200))
        continue
      } else {
        ret = ret[0]
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

export function endsWith(text: string, suffix: string) {
  return text.toString().slice(-suffix.length) === suffix
}

export function genMdlPath(svc: Service): string {
  const mname = store.getters['model/ins'].name
  switch (svc.method) {
    case 'POST':
      return `/mdl/v1/${mname}`
    case 'DELETE':
    case 'PUT':
    case 'GET':
      return `/mdl/v1/${mname}/:index`
    case 'ALL':
      return `/mdl/v1/${mname}s`
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
  if (!options.middle) {
    options.middle = {}
  }
  if (!options.middle.waiting) {
    options.middle.waiting = () => { console.log() }
  }
  if (!options.middle.failed) {
    options.middle.failed = () => { console.log() }
  }
  if (!options.middle.succeed) {
    options.middle.succeed = () => { console.log() }
  }
  if (!options.limit) {
    options.limit = 60
  }
  let countdown = 0
  const func = async () => {
    if (!(await options.chkFun())) {
      // 检查状态不满足要求
      options.middle?.waiting && options.middle.waiting(countdown)
      if (countdown > (options.limit || 60)) {
        // 如果超过等待极限时间，告知
        options.middle?.failed && options.middle.failed()
        clearInterval(h)
      } else {
        ++countdown
      }
      return
    }
    clearInterval(h)
    // 状态满足要求，告知
    options.middle?.succeed && options.middle.succeed()
  }
  const h = setInterval(func, options.interval || 1000)
  setTimeout(func, 200)
}
