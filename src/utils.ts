/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { message } from 'ant-design-vue'
import axios from 'axios'

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
  if (options?.messages?.succeed) {
    message.success(options?.messages?.succeed)
  }
  return Promise.resolve(resp)
}

function reqType(options?: RequestOptions): string {
  return options && options.type ? options.type : 'mdl'
}

export function reqAll(path: string, options?: RequestOptions): Promise<any> {
  return makeRequest(axios.get(`/server-package/${reqType(options)}/v1/${path}s`), options)
}

export async function reqGet(path: string, iden?: any, options?: RequestOptions): Promise<any> {
  return (
    await makeRequest(
      axios.get(`/server-package/${reqType(options)}/v1/${path}${iden ? '/' + iden : ''}`),
      options
    )
  ).data
}

export async function reqPost(path: string, body: any, options?: RequestOptions): Promise<any> {
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
  return (
    await makeRequest(
      axios.post(
        `/server-package/${reqType(options)}/v1/${path}`,
        skipIgnores(body, options.ignores)
      ),
      options
    )
  ).data
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
    axios.delete(`/server-package/${reqType(options)}/v1/${path}/${iden}`),
    options
  )
}

export async function reqPut(
  path: string,
  iden: any,
  body: any,
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
  return (
    await makeRequest(
      axios.put(
        `/server-package/${reqType(options)}/v1/${path}/${iden}`,
        skipIgnores(body, options.ignores)
      ),
      options
    )
  ).data
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
    return makeRequest(axios.put(url), options)
  } else {
    return makeRequest(axios.delete(url), options)
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

export async function until(cdFun: () => boolean, lpLimit = 500) {
  for (let i = 0; i < lpLimit; ++i) {
    if (cdFun()) {
      return Promise.resolve()
    }
    await new Promise(res => setTimeout(res, 200))
  }
  return Promise.reject()
}
