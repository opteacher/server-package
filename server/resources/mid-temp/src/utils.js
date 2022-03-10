import { message } from 'ant-design-vue'
import axios from 'axios'

export async function makeRequest(pms, options) {
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

function reqType(options) {
  return options && options.type ? options.type : 'mdl'
}

export function reqAll(path, options) {
  return makeRequest(axios.get(`/server-package/${reqType(options)}/v1/${path}s`), options)
}

export function reqGet(path, iden, options) {
  return makeRequest(
    axios.get(`/server-package/${reqType(options)}/v1/${path}${iden ? '/' + iden : ''}`),
    options
  )
}

export function endsWith(text, suffix) {
  return text.toString().slice(-suffix.length) === suffix
}
