import store from '@/store'
import { reqDelete, reqPost, reqPut, reqGet } from '@/utils'
import Node from '@/types/node'

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
  all: async (rootKey: string): Promise<Node[]> => {
    const res = await reqGet('node', rootKey, { messages: { notShow: true } })
    if (!res) {
      return []
    }
    const ret = Node.copy(res)
    let nexts: Node[] = []
    for (const nxtKey of ret.nexts) {
      nexts = nexts.concat(await exp.all(nxtKey))
    }
    return [ret].concat(nexts)
  },
  detail: (key: string) => reqGet('node', key, { copy: Node.copy }),
  deps: {
    save: (deps: string[]) => reqPut('node', store.getters['service/edtNdKey'], { deps })
  }
}

export default exp
