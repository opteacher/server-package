import store from '@/store'
import { reqPut, pickOrIgnore } from '@/utils'

export default {
  add: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { 'auth.apis': data },
      { axiosConfig: { params: { _updMode: 'append' } } }
    ),
  remove: (key: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.apis[{_id:${key}}]`]: null },
      { axiosConfig: { params: { _updMode: 'delete' } } }
    ),
  update: (data: any) =>
    reqPut('project', store.getters['project/ins'].key, {
      [`auth.apis[{_id:${data.key}}]`]: pickOrIgnore(data, ['key'])
    }),
  all: () => store.getters['project/apis'],
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
