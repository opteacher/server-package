import { message } from 'ant-design-vue'
import axios from 'axios'

export interface RequestOptions {
  middles?: {
    before?: () => void
    after?: (resp: any) => void
  }
  messages?: {
    loading?: string
    succeed?: string
  },
  ignores?: string[]
}

export async function makeRequest (pms: Promise<any>, options?: RequestOptions): Promise<any> {
  options?.middles?.before && options?.middles?.before()
  message.loading(options?.messages?.loading || '加载中……')
  const resp = (await pms).data
  message.destroy()
  options?.middles?.after && options?.middles?.after(resp)
  if (options?.messages?.succeed) {
    message.success(options?.messages?.succeed)
  }
  return Promise.resolve(resp)
}

export function reqGet (path: string, iden?: any, options?: RequestOptions): Promise<any> {
  return makeRequest(axios.get(`/server-package/mdl/v1/${path}${iden ? '/' + iden : ''}`), options)
}

export function reqPost (path: string, body: any, options?: RequestOptions): Promise<any> {
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
    options.ignores = []
  }
  return makeRequest(axios.post(
    `/server-package/mdl/v1/${path}`,
    Object.fromEntries(
      Object.entries(body).filter((pair: [string, any]) => !options?.ignores?.includes(pair[0]))
    )
  ), options)
}

export function reqDelete (path: string, iden: any, options?: RequestOptions): Promise<any> {
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
  return makeRequest(axios.delete(`/server-package/mdl/v1/${path}/${iden}`), options)
}

export function reqPut (path: string, iden: any, body: any, options?: RequestOptions): Promise<any> {
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
    options.ignores = []
  }
  return makeRequest(axios.put(
    `/server-package/mdl/v1/${path}/${iden}`,
    Object.fromEntries(
      Object.entries(body).filter((pair: [string, any]) => !options?.ignores?.includes(pair[0]))
    )
  ), options)
}

export function reqLink (
  body: {
    parent: [string, any],
    child: [string, any],
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
    '/server-package/mdl/v1',
    body.parent[0], body.parent[1],
    body.child[0], body.child[1]
  ].join('/')
  if (link) {
    return makeRequest(axios.put(url), options)
  } else {
    return makeRequest(axios.delete(url), options)
  }
}

export function getProperty (obj: any, props: string | string[]): any {
  if (typeof props === 'string') {
    props = props.split('.')
  }
  for (const prop of props) {
    if (obj instanceof Array
    && prop.startsWith('[')
    && prop.endsWith(']')) {
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
