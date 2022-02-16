/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Node,
  Service,
  Variable,
  NodeTypeMapper,
  Project,
  Dep,
  OpnType,
  LstOpnType
} from '@/common'
import {
  reqDelete,
  reqGet,
  reqLink,
  reqPost,
  reqPut,
  makeRequest,
  skipIgnores,
  until,
  reqAll
} from '@/utils'
import {
  EditNodeEmitter,
  EditNodeMapper,
  ServiceMapper,
  ArrowHlfHgt,
  CardGutter,
  CardHlfWid,
  CardHlfGutter,
  CardWidth,
  ArrowHeight,
  NodeInPnl
} from '@/views/Flow'
import axios from 'axios'
import { Dispatch } from 'vuex'
import router from '@/router'
import { notification } from 'ant-design-vue'
import { reactive } from 'vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'

type NodesInPnl = { [key: string]: NodeInPnl }
type SvcState = {
  pjt: Project
  svc: Service
  emitter: Emitter
  nodes: NodesInPnl
  width: number
  node: Node
  locVars: Variable[]
  svcVsb: boolean
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
      pjt: new Project(),
      svc: new Service(),
      emitter: new Emitter(),
      nodes: {} as NodesInPnl,
      width: 0,
      node: new Node(),
      locVars: [] as Variable[],
      svcVsb: false,
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
      if (state.node.previous && state.nodes[state.node.previous].type === 'condition') {
        // 添加修改条件节点
        state.node.type = 'condNode'
        EditNodeMapper.delete.display = state.node.key !== ''
        EditNodeMapper.type.options = [{ label: '条件节点', value: 'condNode' }]
      } else if (state.node.type === 'endNode') {
        // 修改循环结束节点
        EditNodeMapper.delete.display = false
        EditNodeMapper.type.options = [{ label: '循环结束节点', value: 'endNode' }]
      } else if (state.node.key) {
        // 修改结束节点
        EditNodeMapper.delete.display = true
        EditNodeMapper.type.options = [
          {
            label: NodeTypeMapper[state.node.type],
            value: state.node.type
          }
        ]
      } else {
        // 添加结束节点
        EditNodeMapper.delete.display = false
        EditNodeMapper.type.options = Object.entries(NodeTypeMapper)
          .map(([key, val]) => ({
            label: val,
            value: key
          }))
          .filter(item => item.value !== 'endNode' && item.value !== 'condNode')
      }
      EditNodeMapper.inputs.dsKey = `service/nodes.${state.node.key}.inputs`
      if (EditNodeMapper.inputs.mapper) {
        EditNodeMapper.inputs.mapper['value'].options = getLocVars(state).map(
          (locVar: Variable) => ({
            label: locVar.value || locVar.name,
            value: locVar.value || locVar.name
          })
        )
      }
      EditNodeMapper.outputs.dsKey = `service/nodes.${state.node.key}.outputs`
      state.nodeVsb = true
      EditNodeEmitter.emit('viewOnly', payload.viewOnly)
    },
    SET_NODE_INVSB(state: SvcState) {
      state.nodeVsb = false
    },
    SET_SVC_VSB(state: SvcState, payload?: boolean) {
      state.svcVsb = typeof payload !== 'undefined' ? payload : false
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
      if (!router.currentRoute.value.params.aid) {
        return
      }
      const aid = router.currentRoute.value.params.aid

      const pid = router.currentRoute.value.params.pid
      Project.copy(await reqGet('project', pid), state.pjt)
      ServiceMapper['path'].prefix = `/${state.pjt.name}`

      await dispatch('rfshDpdcs')
      EditNodeMapper['deps'].options = Object.values(state.deps).map((dep: Dep) =>
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

      await dispatch('rfshTemps')

      Service.copy(await reqGet('service', aid), state.svc)

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
        return domEle !== null && domEle.clientWidth !== 0 && domEle.clientHeight !== 0
      })
      if (domEle) {
        node.size[0] = domEle.clientWidth
        node.size[1] = domEle.clientHeight
        if (!node.previous) {
          node.posLT[0] = (state.width >> 1) - CardHlfWid
          node.posLT[1] = height
        } else if (node.type === 'endNode') {
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
    async saveNode({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, node: Node) {
      await reqPost(`service/${state.svc.key}/node${node.key ? '/' + node.key : ''}`, node, {
        type: 'api'
      })
      await dispatch('refresh')
    },
    async delNode({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, key: string) {
      await reqDelete(`service/${state.svc.key}/node`, key, { type: 'api' })
      await dispatch('refresh')
    },
    async rfshNode({ state }: { state: SvcState }, key?: string) {
      const nkey = key || state.node.key
      Node.copy(await reqGet('node', nkey), state.nodes[nkey])
      if (!key) {
        Node.copy(state.nodes[nkey], state.node)
      }
    },
    async saveInOutput(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      payload: { name: string; edited: Variable }
    ) {
      if (!payload.edited.key) {
        const addIOpt = Variable.copy(await reqPost('variable', payload.edited))
        await reqLink({
          parent: ['node', state.node.key],
          child: [`${payload.name}s`, addIOpt.key]
        })
      } else {
        await reqPut('variable', payload.edited.key, payload.edited)
      }
      await dispatch('rfshNode')
    },
    async delInOutput(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      payload: { name: string; delKey: string }
    ) {
      await reqLink(
        {
          parent: ['node', state.node.key],
          child: [`${payload.name}s`, payload.delKey]
        },
        false
      )
      await reqDelete('variable', payload.delKey)
      await dispatch('rfshNode')
    },
    async joinLibrary({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, group: string) {
      const baseURL = '/server-package/api/v1/node/temp'
      // 组和标题与数据库中模板节点相等的，判定为不可入库
      if (
        (
          await makeRequest(
            axios.get(`${baseURL}/exists`, {
              params: { group, title: state.node.title }
            })
          )
        ).length
      ) {
        notification.error({
          message: '加入模板库错误！',
          description: '模板库已有相应节点存在，如需修改，点击模板节点库查看修改'
        })
        return
      }
      const tempNode = Node.copy(
        await makeRequest(
          axios.post(
            baseURL,
            Object.assign(
              skipIgnores(state.node, [
                'key',
                'inputs',
                'outputs',
                'nexts',
                'previous',
                'relative'
              ]),
              { group, isTemp: true }
            )
          )
        )
      )
      for (const input of state.node.inputs) {
        await reqLink({
          parent: ['node', tempNode.key],
          child: [
            'inputs',
            (
              await reqPost('variable', input, {
                ignores: ['value', 'prop']
              })
            )._id
          ]
        })
      }
      for (const output of state.node.outputs) {
        await reqLink({
          parent: ['node', tempNode.key],
          child: ['outputs', (await reqPost('variable', output))._id]
        })
      }
      state.joinVsb = false
      await reqPut('node', state.node.key, { group })
      await dispatch('rfshTemps')
      await dispatch('rfshNode')
    },
    async rfshTemps({ state }: { state: SvcState }) {
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
      EditNodeMapper['temp'].options = Object.entries(groups).map(([group, nodes]) => ({
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
    async rfshDpdcs({ state }: { state: SvcState }) {
      state.deps = Object.fromEntries(
        (await reqGet('dependencys'))
          .map((dep: any) => Dep.copy(dep))
          .map((dep: Dep) => [dep.key, dep])
      )
    }
  },
  getters: {
    ins: (state: SvcState): Service => state.svc,
    pjt: (state: SvcState): Project => state.pjt,
    emitter: (state: SvcState): Emitter => state.emitter,
    nodes: (state: SvcState): NodesInPnl => {
      return Object.fromEntries(Object.entries(state.nodes).filter(([, node]) => !node.isTemp))
    },
    width: (state: SvcState): number => state.width,
    node:
      (state: SvcState) =>
      (key: string): NodesInPnl =>
        state.nodes[key],
    editNode: (state: SvcState): Node => state.node,
    nodeVsb: (state: SvcState): boolean => state.nodeVsb,
    locVars: (state: SvcState) => state.locVars,
    joinVsb: (state: SvcState): boolean => state.joinVsb,
    svcVsb: (state: SvcState): boolean => state.svcVsb,
    tempNodes: (state: SvcState): Node[] => {
      return Object.values(state.nodes).filter((nd: any) => nd.isTemp)
    },
    tempVsb: (state: SvcState): boolean => state.tempVsb,
    deps:
      (state: SvcState) =>
      (key: string): Dep[] =>
        state.node[key].deps,
    tempGrps: () => (EditNodeMapper['temp'].options as OpnType[]).map(reactive)
  }
}
