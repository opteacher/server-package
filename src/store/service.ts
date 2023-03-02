/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Node, { NodeTypeMapper } from '@/types/node'
import Service from '@/types/service'
import Dep from '@/types/dep'
import { LstOpnType } from '@lib/types/mapper'
import { edtNdEmitter, edtNdMapper, buildNodes, fixWidth, fillPlaceholder } from '@/views/Flow'
import router from '@/router'
import NodeInPnl from '@/types/ndInPnl'
import { depAPI, ndAPI, svcAPI } from '@/apis'

export type NodesInPnl = { [key: string]: NodeInPnl }
type SvcState = {
  service: Service
  nodes: NodesInPnl
  width: number
  edtNdKey: string
}

export default {
  namespaced: true,
  state: () =>
    ({
      service: new Service(),
      nodes: {} as NodesInPnl,
      width: 0,
      edtNdKey: ''
    } as SvcState),
  mutations: {
    SET_WIDTH(state: SvcState, width: number) {
      state.width = width
    },
    SET_NODE(state: SvcState, payload?: { key?: string; viewOnly?: boolean }) {
      if (!payload) {
        payload = { key: '', viewOnly: false }
      }
      state.edtNdKey = payload.key || ''
      if (!state.edtNdKey) {
        return
      }
      const edtNode = state.nodes[state.edtNdKey]
      if (edtNode.previous && state.nodes[edtNode.previous].ntype === 'condition') {
        // 添加修改条件节点
        edtNode.ntype = 'condNode'
        edtNdMapper.delete.display = state.edtNdKey !== ''
        edtNdMapper.ntype.options = [{ label: '条件节点', value: 'condNode' }]
      } else if (edtNode.ntype === 'endNode') {
        // 修改循环结束节点
        edtNdMapper.delete.display = false
        edtNdMapper.ntype.options = [{ label: '循环结束节点', value: 'endNode' }]
      } else if (edtNode.key) {
        // 修改结束节点
        edtNdMapper.delete.display = true
        edtNdMapper.ntype.options = [
          {
            label: NodeTypeMapper[edtNode.ntype],
            value: edtNode.ntype
          }
        ]
      } else {
        // 添加结束节点
        edtNdMapper.delete.display = false
        edtNdMapper.ntype.options = Object.entries(NodeTypeMapper)
          .map(([key, val]) => ({
            label: val,
            value: key
          }))
          .filter(item => item.value !== 'endNode' && item.value !== 'condNode')
      }
      edtNdMapper.advanced.items.inputs.dsKey = `service/nodes.${state.edtNdKey}.inputs`
      edtNdMapper.advanced.items.outputs.dsKey = `service/nodes.${state.edtNdKey}.outputs`
      edtNdEmitter.emit('update:mapper', edtNdMapper)
      edtNdEmitter.emit('update:show', {
        show: true,
        viewOnly: payload.viewOnly,
        cpyRcd: (tgt: Node) => Node.copy(edtNode, tgt, true)
      })
    },
    RESET_NODE(state: SvcState) {
      state.edtNdKey = ''
    },
    RESET_STATE(state: SvcState) {
      state.service.reset()
      state.width = 0
      state.nodes = {}
      state.edtNdKey = ''
    },
    RESET_NODES(state: SvcState) {
      state.width = 0
      state.nodes = {}
      state.edtNdKey = ''
    }
  },
  actions: {
    async refresh({ state }: { state: SvcState }) {
      if (!router.currentRoute.value.params.sid) {
        return
      }
      const sid = router.currentRoute.value.params.sid
      const deps = await depAPI.all()
      edtNdMapper.advanced.items.deps.lvMapper = Object.fromEntries(
        deps.map((dep: Dep) => [dep.key, dep.name])
      )
      edtNdMapper.advanced.items.deps.mapper.deps.options = deps.map((dep: Dep) =>
        LstOpnType.copy({
          key: dep.key,
          title: dep.name,
          subTitle: [
            'import ',
            dep.default ? dep.exports[0] : `{ ${dep.exports.join(', ')} }`,
            ` from '${dep.from}'`
          ].join('')
        })
      )
      state.service = await svcAPI.detail(sid)
      if (state.service.flow) {
        const rootKey = state.service.flow.key
        // commit('RESET_NODES')
        state.nodes = Object.fromEntries(
          (await ndAPI.all(rootKey)).map(node => [node.key, NodeInPnl.copy(node)])
        )
        await buildNodes(rootKey, 0)
        await fillPlaceholder(rootKey)
        await fixWidth()
      } else {
        state.nodes = {}
        state.edtNdKey = ''
      }
    },
    async refreshNode({ state }: { state: SvcState }, key?: string) {
      const nkey = key || state.edtNdKey
      state.nodes[nkey] = await ndAPI.detail(nkey)
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
    editNode: (state: SvcState): Node => state.nodes[state.edtNdKey]
  }
}
