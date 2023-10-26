import store from '@/store'
import Service from '@/types/service'
import { endsWith, intervalCheck, pickOrIgnore, reqDelete, reqGet, reqPost, reqPut } from '@/utils'

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
    codes: (key: any) => reqGet('service', `${key}/flow/codes`, { type: 'api' }),
    build: (key: any, width: number) =>
      reqPost(`service/${key}/node/s/build`, { width }, { type: 'api' }),
    export: async (key: any) => {
      const resp = await reqGet('service', `/${key}/flow/export`, { type: 'api', orgRes: true })
      // 创建对象url
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(
        new Blob([JSON.stringify(resp.data)], { type: resp.headers['content-type'] })
      )
      const filename = window.decodeURI(resp.headers['content-disposition'].split('=')[1])
      link.download = filename.substring(
        filename.startsWith('"') ? 1 : 0,
        endsWith(filename, '"') ? filename.length - 1 : 0
      )
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
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
