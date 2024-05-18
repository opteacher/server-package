import store from '@/store'
import { reqPut, pickOrIgnore } from '@/utils'

export default {
  add: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { 'auth.roles': data },
      { axiosConfig: { params: { _updMode: 'append' } } }
    ),
  remove: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${data.key}}]`]: null },
      { axiosConfig: { params: { _updMode: 'delete' } } }
    ),
  update: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${data.key}}]`]: pickOrIgnore(data, ['key']) },
      { axiosConfig: { params: { _updMode: 'merge' } } }
    ),
  all: () =>
    store.getters['project/auth'].roles,
  detail: (key: any) => {
    console.log(key)
  }
}
