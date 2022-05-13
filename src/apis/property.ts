import store from '@/store'
import { reqPut } from '@/utils'

export default {
  add: (data: any) =>
    reqPut('model', `${store.getters['model/ins'].key}?updMode=append`, { props: data }),
  remove: (key: any) =>
    reqPut('model', `${store.getters['model/ins'].key}?updMode=delete`, {
      [`props[{_id:${key}}]`]: null
    }),
  update: (data: any) =>
    reqPut('model', store.getters['model/ins'].key, { [`props[{name:${data.name}}]`]: data }),
  all: () => [],
  detail: (key: any) => {
    console.log(key)
  }
}
