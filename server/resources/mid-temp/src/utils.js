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

export async function waitFor(iden, options = {}) {
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

export function endsWith(text, suffix) {
  return (typeof text !== 'undefined' ? text.toString() : '').slice(-suffix.length) === suffix
}
