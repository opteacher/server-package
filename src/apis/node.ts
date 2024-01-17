import store from '@/store'
import Node from '@/types/node'
import { reqDelete, reqGet, reqPost, reqPut } from '@/utils'

function getFlowCtnr() {
  if (store.getters['node/subNdKey']) {
    return ['subNode', store.getters['node/subNdKey']]
  } else if (store.getters['node/svcKey']) {
    return ['service', store.getters['node/svcKey']]
  } else if (store.getters['node/funKey']) {
    return ['typFun', store.getters['node/funKey']]
  } else {
    throw new Error('未知流程设计！')
  }
}

export default {
  save: (data: any) => {
    const flowCtnr = getFlowCtnr()
    const nid = data.key ? '/' + data.key : ''
    return reqPost(`service/${flowCtnr[1]}/node${nid}`, data, {
      type: 'api',
      copy: Node.copy,
      axiosConfig: { params: { flowMod: flowCtnr[0] } }
    })
  },
  remove: (key: any) => {
    const flowCtnr = getFlowCtnr()
    return reqDelete(`service/${flowCtnr[1]}`, `node/${key}`, {
      type: 'api',
      axiosConfig: { params: { flowMod: flowCtnr[0] } }
    })
  },
  all: (nid: string): Promise<Node[]> =>
    reqGet('flow', `${nid}/nodes`, { type: 'api', copy: Node.copy }),
  detail: (key: string) => reqGet('node', key, { copy: Node.copy }),
  deps: {
    save: (deps: string[]) => reqPut('node', store.getters['node/edtNdKey'], { deps })
  }
}
