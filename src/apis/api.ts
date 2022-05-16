import store from '@/store'
import { reqPut, skipIgnores } from '@/utils'

function recuAPIs(obj: any): any[] {
  const ret = []
  for (const key of Object.keys(obj)) {
    ret.push({
      label: key,
      value: key,
      children: recuAPIs(obj[key])
    })
  }
  return ret
}

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
  all: (offset?: number, limit?: number) => {
    const ret = {} as Record<string, any>
    for (const api of store.getters['project/auth'].apis) {
      let obj = ret
      for (const ptPath of api.path.split('/').filter((str: string) => str)) {
        if (!(ptPath in obj)) {
          obj[ptPath] = {} as Record<string, any>
        }
        obj = obj[ptPath]
      }
    }
    if (limit) {
      return recuAPIs(ret).slice(offset || 0 + 1, offset || 0 + limit)
    } else {
      return recuAPIs(ret)
    }
  },
  detail: (_key: any) => {
    console.log('get project detail')
  },

}
