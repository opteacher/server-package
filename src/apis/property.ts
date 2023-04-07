import store from '@/store'
import { reqDelete, reqPost, reqPut } from '@/utils'

export default {
  add: (data: any) =>
    reqPost('model/' + store.getters['model/ins'].key + '/property', data, { type: 'api' }),
  remove: (prop: any) =>
    reqDelete('model/' + store.getters['model/ins'].key, 'property/' + prop.key, { type: 'api' }),
  update: (data: any) =>
    reqPut('model/' + store.getters['model/ins'].key, 'property/' + data.key, data, {
      type: 'api'
    }),
  all: () => [],
  detail: (key: any) => {
    console.log(key)
  }
}
