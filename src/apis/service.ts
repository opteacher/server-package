import store from '@/store'
import Service from '@/types/service'
import {
  downloadFile,
  endsWith,
  intervalCheck,
  pickOrIgnore,
  reqDelete,
  reqGet,
  reqPost,
  reqPut
} from '@/utils'

export default {
  add: async (data: any) => {
    const pid = store.getters['project/ins'].key
    data.condition = `${data.cdValue}${data.cdUnit}`
    const svc = Service.copy(await reqPost('service', data, { ignores: ['model'] }))
    if (data.model) {
      await reqPut(`service/${svc.key}`, `model/${data.model}`)
    }
    return reqPut(`project/${pid}`, `services/${svc.key}`)
  },
  remove: async (data: any) => {
    const pid = store.getters['project/ins'].key
    if (!data.model) {
      delete data.model
    }
    await reqDelete(`project/${pid}`, `services/${data.key}`)
    return reqDelete('service', data.key, { type: 'api' })
  },
  update: async (data: any) => {
    if (data.cdValue) {
      data.condition = `${data.cdValue}${data.cdUnit}`
    }
    if (data.model) {
      await reqPut(`service/${data.key}`, `model/${data.model}`)
    }
    return reqPut('service', data.key, data, { ignores: ['flow', 'model'] })
  },
  all: async () => {
    await store.dispatch('project/refresh')
    return store.getters['project/ins'].services
  },
  detail: (key: any) => reqGet('service', key, { copy: Service.copy }),
  flow: {
    codes: (key: any, funName = '') =>
      reqGet('flow', `${key}/codes`, { type: 'api', axiosConfig: { params: { funName } } }),
    build: (key: any, width: number) =>
      reqPost(`flow/${key}/nodes`, { width }, { type: 'api', action: 'build' }),
    export: async (key: any) =>
      downloadFile(await reqGet('service', `/${key}/flow/export`, { type: 'api', orgRes: true })),
    import: (key: any, body: { impFile: string }) =>
      reqPost(`service/${key}/flow/import`, body, { type: 'api' })
  },
  job: {
    restart: async (key: any) => {
      await reqPost(`service/${key}/job/restart`, undefined, {
        type: 'api',
        axiosConfig: { params: { pid: store.getters['project/ins'].key } }
      })
      intervalCheck({
        chkFun: async () => {
          try {
            await store.dispatch('node/refresh', { onlyIns: true })
            return store.getters['node/service'].jobId !== 0
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
            await store.dispatch('node/refresh', { onlyIns: true })
            return store.getters['node/service'].jobId === 0
          } catch (e: any) {
            return false
          }
        }
      })
    }
  }
}
