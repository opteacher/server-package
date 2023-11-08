import store from '@/store'
import Dep from '@/types/dep'
import { reqAll, reqDelete, reqPost, reqPut } from '@/utils'

export default {
  add: (data: any) => reqPost('dependency', data),
  remove: (key: any) => reqDelete('dependency', key),
  update: (data: any) => reqPut('dependency', data.key, data),
  all: async (): Promise<Dep[]> =>
    reqAll('dependency', {
      copy: Dep.copy,
      axiosConfig: { params: { belong: ['==', 'null'] } }
    }),
  allByPjt: async () => {
    await store.dispatch('project/refresh')
    const pjtName = store.getters['project/ins'].name
    if (pjtName) {
      return reqAll('dependency', {
        copy: Dep.copy,
        axiosConfig: { params: { belong: ['==', pjtName] } }
      })
    }
    return []
  },
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
