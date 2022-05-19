import store from '@/store'
import { reqPut, skipIgnores } from '@/utils'
import pjtAPI from './project'

export default {
  add: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { 'auth.apis': data },
      { query: { updMode: 'append' } }
    ),
  remove: (key: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.apis[{_id:${key}}]`]: null },
      { query: { updMode: 'delete' } }
    ),
  update: (data: any) =>
    reqPut('project', store.getters['project/ins'].key, {
      [`auth.apis[{_id:${data.key}}]`]: skipIgnores(data, ['key'])
    }),
  all: () => store.getters['project/apis'],
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
