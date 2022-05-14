import store from '@/store'
import { reqDelete, reqPost, reqPut } from '@/utils'

export default {
  add: (data: any) => {
    const mid = store.getters['model/ins'].key
    return reqPost(`model/${mid}/property`, data, { type: 'api' })
  },
  remove: (key: any) => {
    const mid = store.getters['model/ins'].key
    return reqDelete(`model/${mid}`, `property/${key}`, { type: 'api' })
  },
  update: (data: any) => {
    const mid = store.getters['model/ins'].key
    return reqPut(`model/${mid}`, `property/${data.key}`, data, { type: 'api' })
  },
  all: () => [],
  detail: (key: any) => {
    console.log(key)
  }
}
