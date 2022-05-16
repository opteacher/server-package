import store from '@/store'
import { reqPut, skipIgnores } from '@/utils'

export default (rid: string) => ({
  add: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${rid}}].rules`]: data },
      { query: { updMode: 'append' } }
    ),
  remove: (key: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${rid}}].rules[{_id:${key}}]`]: null },
      { query: { updMode: 'delete' } }
    ),
  update: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${rid}}].rules[{_id:${data.key}}]`]: skipIgnores(data, ['key']) },
      { query: { updMode: 'merge' } }
    ),
  all: (offset: number, limit: number) =>
    store.getters['project/ins'].auth.roles
      .find((role: any) => role.key === rid)
      .rules.slice(offset + 1, offset + limit),
  detail: (key: any) => {
    console.log(key)
  }
})
