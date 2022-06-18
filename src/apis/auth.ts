import store from '@/store'
import { reqDelete, reqPost, reqPut } from '@/utils'

export default {
  bind: (data: { model: string; skips?: string[] }) =>
    reqPost(`project/${store.getters['project/ins'].key}/auth/bind`, data, { type: 'api' }),
  unbind: () =>
    reqDelete('project', `${store.getters['project/ins'].key}/auth/unbind`, { type: 'api' }),
  cmpProp: {
    add: (data: { name: string; alg: string }) =>
      reqPut(
        'project',
        store.getters['project/ins'].key,
        { 'auth.props': data },
        { query: { updMode: 'append' } }
      ),
    rmv: (key: any) =>
      reqPut(
        'project',
        store.getters['project/ins'].key,
        { [`auth.props[{_id:${key}}]`]: null },
        { query: { updMode: 'delete' } }
      )
  },
  sign: {
    gen: (props: any[]) =>
      reqPost(`project/${store.getters['project/ins'].key}/auth/sign`, { props }, { type: 'api' })
  }
}
