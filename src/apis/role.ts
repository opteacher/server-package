import store from '@/store'
import { reqPut, skipIgnores } from '@/utils'

export default {
  add: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { 'auth.roles': data },
      { query: { updMode: 'append' } }
    ),
  remove: (key: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${key}}]`]: null },
      { query: { updMode: 'delete' } }
    ),
  update: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${data.key}}]`]: skipIgnores(data, ['key']) },
      { query: { updMode: 'merge' } }
    ),
  all: (offset: number, limit: number) =>
    store.getters['project/auth'].roles.slice(offset, offset + limit),
  detail: (key: any) => {
    console.log(key)
  }
}
