import store from '@/store'
import Service from '@/types/service'
import { reqDelete, reqGet, reqPost, reqPut, makeRequest } from '@/utils'
import axios from 'axios'

export default {
  add: async (data: any) => {
    const mid = store.getters['model/ins'].key
    data.condition = `${data.cdValue}${data.cdUnit}`
    const svc = Service.copy(await reqPost('service', data))
    return reqPut(`model/${mid}`, `svcs/${svc.key}`)
  },
  remove: async (key: any) => {
    const mid = store.getters['model/ins'].key
    await reqDelete(`model/${mid}`, `svcs/${key}`)
    return reqDelete('service', key)
  },
  update: (data: any) => {
    if (data.cdValue) {
      data.condition = `${data.cdValue}${data.cdUnit}`
    }
    return reqPut('service', data.key, data)
  },
  all: async () => {
    await store.dispatch('model/refresh')
    return store.getters['model/ins'].svcs
  },
  detail: (key: any) => reqGet('model', key),
  restartJob: async (key: any) => {
    await makeRequest(
      axios.post(
        `/server-package/api/v1/service/${key}/job/restart`,
        {},
        {
          params: { pid: store.getters['project/ins'].key }
        }
      )
    )
    await store.dispatch('service/refresh')
  },
  stopJob: async (key: any) => {
    await makeRequest(
      axios.delete(`/server-package/api/v1/service/${key}/job/stop`, {
        params: { pid: store.getters['project/ins'].key }
      })
    )
    await store.dispatch('service/refresh')
  }
}
