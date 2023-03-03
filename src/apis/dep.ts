import store from '@/store'
import Dep from '@/types/dep'
import { reqAll, reqDelete, reqPost, reqPut } from '@/utils'

export default {
  add: (data: any) => reqPost('dependency', data),
  remove: (key: any) => reqDelete('dependency', key),
  update: (data: any) => reqPut('dependency', data.key, data),
  all: async (): Promise<Dep[]> => {
    const ret = await reqAll('dependency', {
      copy: Dep.copy,
      axiosConfig: { params: { belong: ['==', 'null'] } }
    })
    const pjtName = store.getters['project/ins'].name
    if (pjtName) {
      ret.concat(await reqAll('dependency', {
        copy: Dep.copy,
        axiosConfig: { params: { belong: ['==', pjtName] } }
      }))
    }
    return ret
  },
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
