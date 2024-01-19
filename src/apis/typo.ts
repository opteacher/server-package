import store from '@/store'
import Typo from '@/types/typo'
import { reqDelete, reqGet, reqPost, reqPut } from '@/utils'

export default {
  all: (): Promise<Typo[]> =>
    store.dispatch('project/refresh').then(() => store.getters['project/ins'].typos),
  get: (key: string): Promise<Typo> => reqGet('typo', key, { copy: Typo.copy }),
  add: (typo: Typo) =>
    reqPost('typo', typo, {
      type: 'api',
      copy: Typo.copy,
      axiosConfig: { params: { pid: store.getters['project/key'] } }
    }),
  update: (typo: Typo) =>
    reqPut('typo', typo.key, typo, {
      type: 'api',
      copy: Typo.copy,
      axiosConfig: { params: { pid: store.getters['project/key'] } }
    }),
  remove: (typo: Typo) =>
    reqDelete('typo', typo.key, {
      type: 'api',
      axiosConfig: { params: { pid: store.getters['project/key'] } }
    })
}
