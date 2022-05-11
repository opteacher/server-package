import store from '@/store'
import { reqGet, reqDelete, reqPost, reqPut } from '@/utils'
import Model from '@/types/model'
import { pjtAPI } from '.'

export default {
  add: async (data: any) => {
    const model = Model.copy(await reqPost('model', data))
    const pid = store.getters['project/ins'].key
    await reqPut(`project/${pid}`, `models/${model.key}`)
    return model
  },
  remove: async (key: any) => {
    const pid = store.getters['project/ins'].key
    await reqDelete(`project/${pid}`, `models/${key}`)
    return reqDelete('model', key, { type: 'api' })
  },
  update: (data: any) => reqPut('model', data.key, data),
  all: async () => {
    await store.dispatch('project/refresh')
    return store.getters['project/ins'].models
  },
  detail: (key: any) => reqGet('model', key).then((mdl: any) => Model.copy(mdl))
}
