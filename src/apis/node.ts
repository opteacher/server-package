import store from '@/store'
import Node from '@/types/node'
import { reqDelete, reqGet, reqPost, reqPut } from '@/utils'

const exp = {
  save: (data: any) => {
    const isSub = store.getters['service/subNdKey'] as boolean
    const sid = isSub ? store.getters['service/subNdKey'] : store.getters['service/svcKey']
    const nid = data.key ? '/' + data.key : ''
    return reqPost(`service/${sid}/node${nid}`, data, {
      type: 'api',
      copy: Node.copy,
      axiosConfig: { params: { isSub } }
    })
  },
  remove: (key: any) => {
    const isSub = store.getters['service/subNdKey'] as boolean
    const sid = isSub ? store.getters['service/subNdKey'] : store.getters['service/svcKey']
    return reqDelete(`service/${sid}`, `node/${key}`, {
      type: 'api',
      axiosConfig: { params: { isSub } }
    })
  },
  all: (sid: string): Promise<Node[]> => reqGet('service', `${sid}/flow/nodes`, { type: 'api' }),
  subNode: {
    all: (nid: string): Promise<Node[]> => reqGet('node', nid, { action: 'sub/nodes', type: 'api' })
  },
  detail: (key: string) => reqGet('node', key, { copy: Node.copy }),
  deps: {
    save: (deps: string[]) => reqPut('node', store.getters['service/edtNdKey'], { deps })
  }
}

export default exp
