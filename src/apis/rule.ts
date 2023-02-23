import store from '@/store'
import { reqPut, pickOrIgnore } from '@/utils'

export default (rid: string) => ({
  add: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${rid}}].rules`]: data },
      { axiosConfig: { params: { updMode: 'append' } } }
    ),
  remove: (key: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${rid}}].rules[{_id:${key}}]`]: null },
      { axiosConfig: { params: { updMode: 'delete' } } }
    ),
  update: (data: any) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { [`auth.roles[{_id:${rid}}].rules[{_id:${data.key}}]`]: pickOrIgnore(data, ['key']) },
      { axiosConfig: { params: { updMode: 'merge' } } }
    ),
  all: () =>
    store.getters['project/ins'].auth.roles
      .find((role: any) => role.key === rid)
      .rules,
  detail: (key: any) => {
    console.log(key)
  }
})
