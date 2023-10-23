import store from '@/store'
import Node from '@/types/node'
import { reqDelete, reqGet, reqPost, reqPut } from '@/utils'

const exp = {
  save: async (data: any) => {
    const sid = store.getters['service/ins'].key
    const nid = data.key ? '/' + data.key : ''
    await reqPost(`service/${sid}/node${nid}`, data, { type: 'api' })
    await store.dispatch('service/refresh')
  },
  remove: async (key: any) => {
    const sid = store.getters['service/ins'].key
    await reqDelete(`service/${sid}`, `node/${key}`, { type: 'api' })
    await store.dispatch('service/refresh')
  },
  all: async (sid: string): Promise<Node[]> =>
    reqGet('service', `${sid}/flow/nodes`, { type: 'api' }),
  detail: (key: string) => reqGet('node', key, { copy: Node.copy }),
  deps: {
    save: (deps: string[]) => reqPut('node', store.getters['service/edtNdKey'], { deps })
  }
}

export default exp
