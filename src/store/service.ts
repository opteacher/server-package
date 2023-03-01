/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Node, { NodeTypeMapper } from '@/types/node'
import Service from '@/types/service'
import Dep from '@/types/dep'
import { OpnType } from '@/types'
import { LstOpnType } from '@lib/types/mapper'
import { reqGet, until, reqAll, setProp } from '@/utils'
import {
  edtNdEmitter,
  edtNdMapper,
  ArrowHlfHgt,
  CardGutter,
  CardHlfWid,
  CardHlfGutter,
  CardWidth,
  ArrowHeight,
  edtNdVisible,
  ndCdEmitter
} from '@/views/Flow'
import { Dispatch } from 'vuex'
import router from '@/router'
import { reactive } from 'vue'
import NodeInPnl from '@/types/ndInPnl'
import { depAPI, svcAPI } from '@/apis'

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
      edtNdVisible.value = true
      edtNdEmitter.emit('viewOnly', payload.viewOnly)
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
    async refresh({ state, dispatch }: { state: SvcState; dispatch: Dispatch; rootGetters: any }) {
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
      await dispatch('refreshTemps')
      state.service = await svcAPI.detail(sid)
      if (state.service.flow) {
        const rootKey = state.service.flow.key
        // commit('RESET_NODES')
        await dispatch('readNodes', rootKey)
        console.log(state.nodes)
        await dispatch('buildNodes', { ndKey: rootKey, height: 0 })
        await dispatch('fillPlaceholder', rootKey)
        await dispatch('fixWidth')
        ndCdEmitter.emit('refresh')
      }
    },
    async fixWidth({ state, dispatch }: { state: SvcState; dispatch: Dispatch }) {
      let left = 0
      let right = 0
      for (const node of Object.values(state.nodes).filter(nd => !nd.isTemp)) {
        if (node.posLT[0] < left) {
          left = node.posLT[0]
        }
        if (node.posLT[0] + node.size[0] > right) {
          right = node.posLT[0] + node.size[0]
        }
      }
      if (state.width < right - left) {
        state.width = right - left
        await dispatch('refresh')
      }
    },
    async fillPlaceholder(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      key: string
    ) {
      const node = state.nodes[key]
      for (const nxtKey of node.nexts) {
        const nxtNode = state.nodes[nxtKey]
        const height = nxtNode.posLT[1] - (node.posLT[1] + node.size[1])
        if (height > ArrowHeight) {
          node.btmSvgHgt = height - ArrowHlfHgt
        }
        await dispatch('fillPlaceholder', nxtKey)
      }
    },
    async readNodes({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, key: string) {
      const res = await reqGet('node', key)
      if (!res) {
        delete state.nodes[key]
        return
      }
      if (!(key in state.nodes)) {
        setProp(state.nodes, key, NodeInPnl.copy(res))
      } else {
        Node.copy(res, state.nodes[key])
      }
      for (const nxtKey of state.nodes[key].nexts) {
        await dispatch('readNodes', nxtKey)
      }
    },
    async buildNodes(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      { ndKey, height }: { ndKey: string; height: number }
    ) {
      const node = state.nodes[ndKey]
      let domEle: null | HTMLElement = document.getElementById(ndKey)
      await until(() => {
        if (!domEle) {
          domEle = document.getElementById(ndKey)
        }
        return Promise.resolve(
          domEle !== null && domEle.clientWidth !== 0 && domEle.clientHeight !== 0
        )
      })
      if (domEle) {
        node.size[0] = domEle.clientWidth
        node.size[1] = domEle.clientHeight
        if (!node.previous) {
          node.posLT[0] = (state.width >> 1) - CardHlfWid
          node.posLT[1] = height
        } else if (node.ntype === 'endNode') {
          const relNode = state.nodes[node.relative]
          node.posLT[0] = relNode.posLT[0]
          let maxHeight = 0
          const traverse = (node: NodeInPnl) => {
            if (node.key === ndKey) {
              return
            }
            const height = node.posLT[1] + node.size[1] + ArrowHeight
            maxHeight = height > maxHeight ? height : maxHeight
            for (const nxtKey of node.nexts) {
              traverse(state.nodes[nxtKey])
            }
          }
          traverse(relNode)
          node.posLT[1] = maxHeight
        } else {
          const pvsNode = state.nodes[node.previous]
          const nexts = pvsNode.nexts
          const oddLen = nexts.length % 2
          const pvsLft =
            state.nodes[pvsNode.key].posLT[0] + (oddLen ? 0 : CardHlfWid + CardHlfGutter)
          const index = nexts.indexOf(node.key)
          const midIdx = (nexts.length - (oddLen ? 1 : 0)) >> 1
          const idxDif = index - midIdx
          node.posLT[0] =
            pvsLft +
            // + (idxDif > 0 ? CardWidth : 0) //初始定位在中间节点的左边
            idxDif * (CardWidth + CardGutter) // 加上当前节点与中间节点的距离
          // - (idxDif > 0 ? CardWidth : 0) // 如果是右边的节点，则此时定位在节点的右边，调整到左边
          node.posLT[1] = height
        }
      }
      for (const nxtKey of node.nexts) {
        await dispatch('buildNodes', {
          ndKey: nxtKey,
          height: node.posLT[1] + node.size[1] + ArrowHeight
        })
      }
    },
    async refreshNode({ state }: { state: SvcState }, key?: string) {
      const nkey = key || state.edtNdKey
      Node.copy(await reqGet('node', nkey), state.nodes[nkey])
    },
    async refreshTemps({ state }: { state: SvcState }) {
      const resp = await reqAll('node/temp', { type: 'api' })
      for (const node of resp.map((tmpNd: any) => Node.copy(tmpNd))) {
        state.nodes[node.key] = node
      }
      const groups = {} as { [group: string]: Node[] }
      for (const tmpNd of Object.values(state.nodes).filter((nd: Node) => nd.isTemp)) {
        if (tmpNd.group in groups) {
          groups[tmpNd.group].push(tmpNd)
        } else {
          groups[tmpNd.group] = [tmpNd]
        }
      }
      edtNdMapper['temp'].options = Object.entries(groups).map(([group, nodes]) => ({
        label: group,
        value: group,
        children: nodes
          ? (nodes as any[]).map((node: any) => ({
              label: node.title,
              value: node.key
            }))
          : []
      }))
    }
  },
  getters: {
    ins: (state: SvcState): Service => state.service,
    nodes: (state: SvcState): NodesInPnl => {
      return Object.fromEntries(Object.entries(state.nodes).filter(([, node]) => !node.isTemp))
    },
    width: (state: SvcState): number => state.width,
    node:
      (state: SvcState) =>
      (key: string): NodeInPnl =>
        state.nodes[key],
    editNode: (state: SvcState): Node => state.nodes[state.edtNdKey],
    tempNodes: (state: SvcState): Node[] => {
      return Object.values(state.nodes).filter((nd: any) => nd.isTemp)
    },
    tempGrps: () => (edtNdMapper['temp'].options as OpnType[]).map(reactive)
  }
}
