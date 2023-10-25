import store from '@/store'
import Node from '@/types/node'
import { reqDelete, reqGet, reqPost, reqPut } from '@/utils'

const exp = {
  save: (data: any) => {
    const sid = store.getters['service/ins'].key
    const nid = data.key ? '/' + data.key : ''
    return reqPost(`service/${sid}/node${nid}`, data, { type: 'api', copy: Node.copy })
  },
  remove: (key: any) => {
    const sid = store.getters['service/ins'].key
    return reqDelete(`service/${sid}`, `node/${key}`, { type: 'api' })
  },
  all: (sid: string): Promise<Node[]> => reqGet('service', `${sid}/flow/nodes`, { type: 'api' }),
  detail: (key: string) => reqGet('node', key, { copy: Node.copy }),
  deps: {
    save: (deps: string[]) => reqPut('node', store.getters['service/edtNdKey'], { deps })
  }
}

export default exp
