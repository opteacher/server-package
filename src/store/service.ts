/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ndAPI, svcAPI } from '@/apis'
import router from '@/router'
import NodeInPnl from '@/types/ndInPnl'
import Node, { NodeTypeMapper, ndTpOpns } from '@/types/node'
import Service from '@/types/service'
import { edtNdEmitter, edtNdMapper } from '@/views/Flow'

export type NodesInPnl = { [key: string]: NodeInPnl }
type SvcState = {
  service: Service
  nodes: NodesInPnl
  width: number
  editing: Node
}

export default {
  namespaced: true,
  state: () =>
    ({
      service: new Service(),
      nodes: {} as NodesInPnl,
      width: 0,
      editing: new Node()
    } as SvcState),
  mutations: {
    SET_NODE(state: SvcState, payload?: { key?: string; previous?: string; viewOnly?: boolean }) {
      if (!payload || (!payload.key && !payload.previous)) {
        edtNdEmitter.emit('update:mprop', {
          'ntype.options': ndTpOpns.filter(
            item => item.value !== 'endNode' && item.value !== 'condNode'
          )
        })
        edtNdEmitter.emit('update:show', true)
        return
      }
      if (payload.key) {
        state.editing = state.nodes[payload.key]
      } else {
        state.editing = new Node()
        state.editing.previous = payload.previous as string
      }
      if (state.editing.previous && state.nodes[state.editing.previous].ntype === 'condition') {
        // 添加修改条件节点
        state.editing.ntype = 'condNode'
        edtNdMapper.ntype.options = [{ label: '条件节点', value: 'condNode' }]
      } else if (state.editing.ntype === 'endNode') {
        // 修改循环结束节点
        edtNdMapper.ntype.options = [{ label: '循环结束节点', value: 'endNode' }]
      } else if (state.editing.key) {
        // 修改结束节点
        edtNdMapper.ntype.options = [
          {
            label: NodeTypeMapper[state.editing.ntype],
            value: state.editing.ntype
          }
        ]
      } else {
        // 添加结束节点
        edtNdMapper.ntype.options = ndTpOpns.filter(
          item => item.value !== 'endNode' && item.value !== 'condNode'
        )
      }
      edtNdEmitter.emit('update:mprop', {
        'ntype.options': edtNdMapper.ntype.options
      })
      edtNdEmitter.emit('update:show', {
        show: true,
        viewOnly: payload.viewOnly,
        object: state.editing
      })
    },
    RESET_STATE(state: SvcState) {
      state.service.reset()
      state.width = 0
      state.nodes = {}
      state.editing.reset()
    }
  },
  actions: {
    async refresh({ state }: { state: SvcState }, width?: number) {
      if (!router.currentRoute.value.params.sid) {
        return
      }
      const sid = router.currentRoute.value.params.sid as string
      state.service = await svcAPI.detail(sid)
      state.width = width || 0
      if (state.service.flow) {
        state.nodes = Object.fromEntries(
          (await ndAPI.all(sid)).map(node => [node.key, NodeInPnl.copy(node)])
        )
        for (const ndInPnl of await svcAPI.node.build(sid, state.width)) {
          const node = state.nodes[ndInPnl.key]
          node.posLT = ndInPnl.posLT
          node.btmSvgHgt = ndInPnl.btmSvgHgt
        }
      } else {
        state.nodes = {}
        state.editing.reset()
      }
    },
    async refreshNode({ state }: { state: SvcState }, key?: string) {
      const nkey = key || state.editing.key
      if (nkey) {
        NodeInPnl.copy(await ndAPI.detail(nkey), state.nodes[nkey])
      }
    }
  },
  getters: {
    ins: (state: SvcState): Service => state.service,
    nodes: (state: SvcState): NodesInPnl => state.nodes,
    width: (state: SvcState): number => state.width,
    node:
      (state: SvcState) =>
      (key: string): NodeInPnl =>
        state.nodes[key],
    editNode: (state: SvcState): Node => state.editing,
    edtNdKey: (state: SvcState): string => state.editing.key
  }
}
