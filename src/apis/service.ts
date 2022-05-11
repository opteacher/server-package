import store from '@/store'
import Service from '@/types/service'
import { reqAll, reqDelete, reqGet, reqPost, reqPut } from '@/utils'

export const apiAPI = {
  add: async (data: any) => {
    const mid = store.getters['model/ins'].key
    const svc = Service.copy(await reqPost('service', data))
    return reqPut(`model/${mid}`, `service/${svc.key}`)
  },
  remove: async (key: any) => {
    const mid = store.getters['model/ins'].key
    await reqDelete(`model/${mid}`, `service/${key}`)
    return reqDelete('service', key)
  },
  update: (data: any) => reqPut('service', data.key, data),
  all: async () => {
    await store.dispatch('model/refresh')
    return store.getters['model/ins'].svcs.filter((svc: any) => svc.emit === 'api')
  },
  detail: (key: any) => {
    console.log('get project detail')
  }
}

export const jobAPI = {
  add: async (data: any) => {
    const mid = store.getters['model/ins'].key
    const svc = Service.copy(await reqPost('service', data))
    return reqPut(`model/${mid}`, `service/${svc.key}`)
  },
  remove: async (key: any) => {
    const mid = store.getters['model/ins'].key
    await reqDelete(`model/${mid}`, `service/${key}`)
    return reqDelete('service', key)
  },
  update: (data: any) => reqPut('service', data.key, data),
  all: async () => {
    await store.dispatch('model/refresh')
    return store.getters['model/ins'].svcs.filter(
      (svc: any) => svc.emit === 'timeout' || svc.emit === 'interval'
    )
  },
  detail: (key: any) => {
    console.log('get project detail')
  }
}
