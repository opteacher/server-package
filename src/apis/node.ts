import store from '@/store'
import Variable from '@/types/variable'
import { reqDelete, reqPost, reqPut, reqGet } from '@/utils'
import { v4 as uuidv4 } from 'uuid'
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
    save: (deps: string[]) => {
      const edtNode = store.getters['service/editNode']
      return reqPut('node', edtNode.key, { deps })
    }
  },
  inOutput: {
    save: async (payload: { name: 'inputs' | 'outputs'; varb: any }) => {
      const edtNode = store.getters['service/editNode']
      if (!edtNode.key) {
        if (!payload.varb.key) {
          payload.varb.key = uuidv4()
          edtNode[payload.name].push(Variable.copy(payload.varb))
        } else {
          Variable.copy(
            payload.varb,
            edtNode[payload.name].find((varb: any) => varb.key === payload.varb.key)
          )
        }
      } else {
        if (!payload.varb.key) {
          await reqPut(
            'node',
            edtNode.key,
            { [payload.name]: payload.varb },
            { axiosConfig: { params: { updMode: 'append' } } }
          )
        } else {
          await reqPut('node', edtNode.key, {
            [`${payload.name}[{_id:${payload.varb.key}}]`]: payload.varb
          })
        }
        await store.dispatch('service/refreshNode')
      }
    },
    remove: async (payload: { name: 'inputs' | 'outputs'; key: any }) => {
      const edtNode = store.getters['service/editNode']
      if (!edtNode.key) {
        const index = edtNode[payload.name].findIndex((varb: any) => varb.key === payload.key)
        if (index === -1) {
          return
        }
        edtNode[payload.name].splice(index, 1)
      } else {
        await reqPut(
          'node',
          edtNode.key,
          { [`${payload.name}[{_id:${payload.key}}]`]: null },
          { axiosConfig: { params: { updMode: 'delete' } } }
        )
        await store.dispatch('service/refreshNode')
      }
    }
  }
}

export default exp
