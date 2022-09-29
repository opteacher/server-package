import store from '@/store'
import Variable from '@/types/variable'
import { makeRequest, reqDelete, reqPost, reqPut, pickOrIgnore } from '@/utils'
import { joinVisible } from '@/views/Flow'
import { notification } from 'ant-design-vue'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

export default {
  save: async (data: any) => {
    const sid = store.getters['service/ins'].key
    await reqPost(`service/${sid}/node${data.key ? '/' + data.key : ''}`, data, {
      type: 'api'
    })
    await store.dispatch('service/refresh')
  },
  remove: async (key: any) => {
    const sid = store.getters['service/ins'].key
    await reqDelete(`service/${sid}/node`, key, { type: 'api' })
    await store.dispatch('service/refresh')
  },
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
            { query: { updMode: 'append' } }
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
          { query: { updMode: 'delete' } }
        )
        await store.dispatch('service/refreshNode')
      }
    }
  },
  joinLib: async (group: string) => {
    const baseURL = '/server-package/api/v1/node/temp'
    const edtNode = store.getters['service/editNode']
    // 组和标题与数据库中模板节点相等的，判定为不可入库
    const chkExs = await makeRequest(
      axios.get(`${baseURL}/exists`, {
        params: { group, title: edtNode.title }
      })
    )
    if (chkExs.length) {
      notification.error({
        message: '加入模板库错误！',
        description: '模板库已有相应节点存在，如需修改，点击模板节点库查看修改'
      })
      return
    }
    await makeRequest(
      axios.post(
        baseURL,
        Object.assign(pickOrIgnore(edtNode, ['key', 'nexts', 'previous', 'relative']), {
          group,
          isTemp: true
        })
      )
    )
    joinVisible.value = false
    await store.dispatch('service/refreshTemps')
    await store.dispatch('service/refreshNode')
  }
}
