/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Node, { NodeTypeMapper } from '@/types/node'
import Service from '@/types/service'
import Variable from '@/types/variable'
import Dep from '@/types/dep'
import { OpnType } from '@/types'
import { LstOpnType } from '@/types/mapper'
import { reqGet, until, reqAll } from '@/utils'
import {
  edtNdEmitter,
  edtNdMapper,
  ArrowHlfHgt,
  CardGutter,
  CardHlfWid,
  CardHlfGutter,
  CardWidth,
  ArrowHeight
} from '@/views/Flow'
import { Dispatch } from 'vuex'
import router from '@/router'
import { reactive } from 'vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import NodeInPnl from '@/types/ndInPnl'

type NodesInPnl = { [key: string]: NodeInPnl }
type SvcState = {
  svc: Service
  emitter: Emitter
  nodes: NodesInPnl
  width: number
  node: Node
  locVars: Variable[]
  nodeVsb: boolean
  joinVsb: boolean
  tempVsb: boolean
  deps: { [name: string]: Dep }
}

function scanLocVars(state: SvcState, ndKey: string): Variable[] {
  if (!(ndKey in state.nodes)) {
    return []
  }
  const node = state.nodes[ndKey]
  const ret = [] as Variable[]
  if (node.previous) {
    ret.push(...scanLocVars(state, node.previous))
  }
  return ret.concat(node.outputs)
}

function getLocVars(state: SvcState): Variable[] {
  return [Variable.copy({ key: 'context', name: 'ctx', type: 'Object' })].concat(
    state.node.previous ? scanLocVars(state, state.node.previous) : []
  )
}

export default {
  namespaced: true,
  state: () =>
    ({
      svc: new Service(),
      emitter: new Emitter(),
      nodes: {} as NodesInPnl,
      width: 0,
      node: new Node(),
      locVars: [] as Variable[],
      nodeVsb: false,
      joinVsb: false,
      tempVsb: false,
      deps: {}
    } as SvcState),
  mutations: {
    SET_WIDTH(state: SvcState, width: number) {
      state.width = width
    },
    SET_NODE(state: SvcState, payload?: { node?: Node; viewOnly?: boolean }) {
      if (!payload) {
        payload = { node: new Node(), viewOnly: false }
      } else if (!payload.node) {
        payload.node = new Node()
      }
      state.node.reset()
      Node.copy(payload.node, state.node)
      if (state.node.previous && state.nodes[state.node.previous].ntype === 'condition') {
        // 添加修改条件节点
        state.node.ntype = 'condNode'
        edtNdMapper.delete.display = state.node.key !== ''
        edtNdMapper.ntype.options = [{ label: '条件节点', value: 'condNode' }]
      } else if (state.node.ntype === 'endNode') {
        // 修改循环结束节点
        edtNdMapper.delete.display = false
        edtNdMapper.ntype.options = [{ label: '循环结束节点', value: 'endNode' }]
      } else if (state.node.key) {
        // 修改结束节点
        edtNdMapper.delete.display = true
        edtNdMapper.ntype.options = [
          {
            label: NodeTypeMapper[state.node.ntype],
            value: state.node.ntype
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
      edtNdMapper.inputs.dsKey = `service/nodes.${state.node.key}.inputs`
      if (edtNdMapper.inputs.mapper) {
        edtNdMapper.inputs.mapper['value'].options = getLocVars(state).map((locVar: Variable) => ({
          label: locVar.value || locVar.name,
          value: locVar.value || locVar.name
        }))
      }
      edtNdMapper.outputs.dsKey = `service/nodes.${state.node.key}.outputs`
      state.nodeVsb = true
      edtNdEmitter.emit('viewOnly', payload.viewOnly)
    },
    SET_NODE_INVSB(state: SvcState) {
      state.nodeVsb = false
    },
    RESET_NODE(state: SvcState) {
      state.node.reset()
    },
    SET_JOIN_VSB(state: SvcState, payload?: boolean) {
      state.joinVsb = typeof payload !== 'undefined' ? payload : false
    },
    SET_TEMP_VSB(state: SvcState, payload?: boolean) {
      state.tempVsb = typeof payload !== 'undefined' ? payload : false
    },
    UPD_EDT_LOCVARS(state: SvcState) {
      state.locVars = getLocVars(state)
    },
    UPDATE_LOCVARS(state: SvcState, payload?: Node) {
      if (!payload) {
        state.locVars = []
      } else {
        state.locVars = getLocVars(state)
      }
    },
    RESET_STATE(state: SvcState) {
      state.svc.reset()
      state.width = 0
      state.nodes = {}
      state.node.reset()
      state.locVars = []
      state.deps = {}
    },
    RESET_NODES(state: SvcState) {
      state.width = 0
      state.nodes = {}
      state.node.reset()
      state.locVars = []
    }
  },
  actions: {
    async refresh({ state, dispatch }: { state: SvcState; dispatch: Dispatch }) {
      if (!router.currentRoute.value.params.sid) {
        return
      }
      const sid = router.currentRoute.value.params.sid
      await dispatch('model/refresh', undefined, { root: true })
      await dispatch('refreshDeps')
      edtNdMapper['deps'].options = Object.values(state.deps).map((dep: Dep) =>
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
      Service.copy(await reqGet('service', sid), state.svc)
      if (state.svc.flow) {
        const rootKey = state.svc.flow.key
        // commit('RESET_NODES')
        await dispatch('readNodes', rootKey)
        await dispatch('buildNodes', { ndKey: rootKey, height: 0 })
        await dispatch('fillPlaceholder', rootKey)
        await dispatch('fixWidth')
        state.emitter.emit('refresh')
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
        state.nodes[key] = NodeInPnl.copy(res)
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
      const nkey = key || state.node.key
      Node.copy(await reqGet('node', nkey), state.nodes[nkey])
      if (!key) {
        Node.copy(state.nodes[nkey], state.node)
      }
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
    },
    async refreshDeps({ state }: { state: SvcState }) {
      state.deps = Object.fromEntries(
        (await reqGet('dependencys'))
          .map((dep: any) => Dep.copy(dep))
          .map((dep: Dep) => [dep.key, dep])
      )
    }
  },
  getters: {
    ins: (state: SvcState): Service => state.svc,
    emitter: (state: SvcState): Emitter => state.emitter,
    nodes: (state: SvcState): NodesInPnl => {
      return Object.fromEntries(Object.entries(state.nodes).filter(([, node]) => !node.isTemp))
    },
    width: (state: SvcState): number => state.width,
    node:
      (state: SvcState) =>
      (key: string): NodeInPnl =>
        state.nodes[key],
    editNode: (state: SvcState): Node => state.node,
    nodeVsb: (state: SvcState): boolean => state.nodeVsb,
    locVars: (state: SvcState) => state.locVars,
    joinVsb: (state: SvcState): boolean => state.joinVsb,
    tempNodes: (state: SvcState): Node[] => {
      return Object.values(state.nodes).filter((nd: any) => nd.isTemp)
    },
    tempVsb: (state: SvcState): boolean => state.tempVsb,
    deps:
      (state: SvcState) =>
      (key: string): Dep[] =>
        state.nodes[key].deps,
    tempGrps: () => (edtNdMapper['temp'].options as OpnType[]).map(reactive)
  }
}
