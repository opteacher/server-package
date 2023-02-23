import store from '@/store'
import Service from '@/types/service'
import { reqDelete, reqGet, reqPost, reqPut, intervalCheck } from '@/utils'

export default {
  add: async (data: any) => {
    const pid = store.getters['project/ins'].key
    data.condition = `${data.cdValue}${data.cdUnit}`
    const svc = Service.copy(await reqPost('service', data))
    return reqPut(`project/${pid}`, `services/${svc.key}`)
  },
  remove: async (key: any) => {
    const pid = store.getters['project/ins'].key
    await reqDelete(`project/${pid}`, `services/${key}`)
    return reqDelete('service', key, { type: 'api' })
  },
  update: (data: any) => {
    if (data.cdValue) {
      data.condition = `${data.cdValue}${data.cdUnit}`
    }
    return reqPut('service', data.key, data, { ignores: ['flow'] })
  },
  all: async () => {
    await store.dispatch('project/refresh')
    return store.getters['project/ins'].services
  },
  detail: (key: any) => reqGet('model', key),
  job: {
    restart: async (key: any) => {
      await reqPost(`service/${key}/job/restart`, undefined, {
        type: 'api',
        axiosConfig: { params: { pid: store.getters['project/ins'].key } }
      })
      intervalCheck({
        chkFun: async () => {
          try {
            const svc = Service.copy(await reqGet('service', key, { messages: { notShow: true } }))
            return svc.jobId !== 0
          } catch (e: any) {
            return false
          }
        }
      })
    },
    stop: async (key: any) => {
      await reqDelete('service', `${key}/job/stop`, {
        type: 'api',
        axiosConfig: { params: { pid: store.getters['project/ins'].key } }
      })
      intervalCheck({
        chkFun: async () => {
          try {
            const svc = Service.copy(await reqGet('service', key, { messages: { notShow: true } }))
            return svc.jobId === 0
          } catch (e: any) {
            return false
          }
        }
      })
    }
  }
}
