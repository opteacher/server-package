import store from '@/store'
import { reqPut, pickOrIgnore } from '@/utils'

export default {
  add: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { 'auth.roles': data },
      { axiosConfig: { params: { updMode: 'append' } } }
    ),
  remove: (key: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${key}}]`]: null },
      { axiosConfig: { params: { updMode: 'delete' } } }
    ),
  update: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${data.key}}]`]: pickOrIgnore(data, ['key']) },
      { axiosConfig: { params: { updMode: 'merge' } } }
    ),
  all: (offset: number, limit: number) =>
    store.getters['project/auth'].roles.slice(offset, offset + limit),
  detail: (key: any) => {
    console.log(key)
  }
}
