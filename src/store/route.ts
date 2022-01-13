import { Node, NodeInPnl, Route, CardWidth, ArrowHeight, Variable } from '@/common'
import { reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { Dispatch } from 'vuex'

type NodesInPnl = { [key: string]: NodeInPnl }
type RouteState = { route: Route, nodes: NodesInPnl, width: number }

export default {
  namespaced: true,
  state: () => ({
    route: new Route(),
    nodes: {} as NodesInPnl,
    width: 0
  }),
  mutations: {
    SET_WIDTH (state: RouteState, width: number) {
      state.width = width
    },
    SET_ND_SIZE (state: RouteState, payload: { ndKey: string, size: [number, number] }) {
      state.nodes[payload.ndKey].size = payload.size
    }
  },
  actions: {
    async refresh ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, rid?: string) {
      Route.copy((await reqGet('route', rid || state.route.key)).data, state.route)
      if (state && state.route.flow) {
        await dispatch('buildNodes', {
          ndKey: state.route.flow.key,
          height: 0
        })
      }
    },
    async buildNodes (
      { state, dispatch }: { state: RouteState, dispatch: Dispatch },
      { ndKey, height }: { ndKey: string, height: number }
    ) {
      const data = (await reqGet('node', ndKey)).data
      let node: NodeInPnl
      if (!(ndKey in state.nodes)) {
        node = Object.assign(Node.copy(data), {
          posLT: [-1, -1], size: [0, 0]
        }) as NodeInPnl
        state.nodes[ndKey] = node
      } else {
        Node.copy(data, state.nodes[ndKey])
        node = state.nodes[ndKey]
      }
      if (!node.previous) {
        node.posLT[0] = state.width >> 1
      } else {
        const nexts = node.previous.nexts
        const index = nexts.indexOf(node.key) + 1
        const size = nexts.length + 1
        node.posLT[0] = (index / size) * state.width
      }
      node.posLT[0] -= (CardWidth >> 1)
      node.posLT[1] = height
      for (const nxtNode of node.nexts) {
        const nxtNdKey = typeof nxtNode === 'string' ? nxtNode : nxtNode.key
        await dispatch('buildNodes', {
          ndKey: nxtNdKey,
          height: node.posLT[1] + node.size[1] + ArrowHeight
        })
      }
    },
    async saveNode ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, node: Node) {
      const options = { ignores: ['previous', 'nexts', 'inputs', 'outputs'] }
      const newNode = Node.copy(node.key
        ? (await reqPut('node', node.key, node, options)).data
        : (await reqPost('node', node, options)).data
      )
      if (node.key) {
        return dispatch('refresh')
      }
      if (!node.previous) {
        // 绑定根节点
        await reqLink({
          parent: ['route', state.route.key],
          child: ['flow', newNode.key]
        })
      } else {
        // 绑定非根节点
        const previous = Node.copy((
          await reqGet('node', node.previous.key)
        ).data as Node)
        if (previous.type === 'normal' && previous.nexts.length) {
          const nxtKey = (previous.nexts[0] as Node).key
          // 解绑
          await reqLink({
            parent: ['node', previous.key],
            child: ['nexts', nxtKey]
          }, false)
          // 为原来的子节点添加新父节点
          await Promise.all([
            reqLink({
              parent: ['node', newNode.key],
              child: ['nexts', nxtKey]
            }),
            reqLink({
              parent: ['node', nxtKey],
              child: ['previous', newNode.key]
            })
          ])
        }
        await Promise.all([
          reqLink({
            parent: ['node', previous.key],
            child: ['nexts', newNode.key]
          }),
          reqLink({
            parent: ['node', newNode.key],
            child: ['previous', previous.key]
          })
        ])
      }
      await dispatch('refresh')
    },
    async delNode ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, key: string) {
      if (!(key in state.nodes)) {
        return
      }
      const node = state.nodes[key]
      for (const input of node.inputs) {
        const iptKey = typeof input === 'string' ? input : input.key
        await reqLink({
          parent: ['node', node.key],
          child: ['inputs', iptKey]
        }, false)
        await reqDelete('variable', iptKey)
      }
      for (const output of node.outputs) {
        const optKey = typeof output === 'string' ? output : output.key
        await reqLink({
          parent: ['node', node.key],
          child: ['outputs', optKey]
        }, false)
        await reqDelete('variable', optKey)
      }
      const pvsKey = node.previous?.key
      let nxtKeys = []
      if (node.nexts.length) {
        if (typeof node.nexts[0] === 'string') {
          nxtKeys = node.nexts
        } else {
          nxtKeys = node.nexts.map((nxt: any) => nxt.key)
        }
      }
      await reqLink({
        parent: ['node', pvsKey],
        child: ['nexts', node.key]
      }, false)
      for (const nxtKey of nxtKeys) {
        await Promise.all([
          reqLink({
            parent: ['node', pvsKey],
            child: ['nexts', nxtKey],
          }),
          reqLink({
            parent: ['node', nxtKey],
            child: ['previous', pvsKey],
          })
        ])
      }
      await reqDelete('node', node.key)
      await dispatch('refresh')
    },
    async rfshNode ({ state }: { state: RouteState }, key: string) {
      Node.copy((await reqGet('node', key)).data, state.nodes[key])
    },
    async saveInOutput ({ dispatch }: { dispatch: Dispatch }, payload: {
      name: string, ndKey: string, edited: Variable
    }) {
      if (!payload.edited.key) {
        const addIOpt = Variable.copy(
          (await reqPost('variable', payload.edited)).data
        )
        await reqLink({
          parent: ['node', payload.ndKey],
          child: [`${payload.name}s`, addIOpt.key]
        })
      } else {
        await reqPut('variable', payload.edited.key, payload.edited)
      }
      await dispatch('rfshNode', payload.ndKey)
    },
    async delInOutput ({ dispatch }: { dispatch: Dispatch }, payload: {
      name: string, ndKey: string, delKey: string
    }) {
      await reqLink({
        parent: ['node', payload.ndKey],
        child: [`${payload.name}s`, payload.delKey]
      }, false)
      await reqDelete('variable', payload.delKey)
      await dispatch('rfshNode', payload.ndKey)
    }
  },
  getters: {
    route: (state: RouteState): Route => state.route,
    nodes: (state: RouteState): NodesInPnl => state.nodes,
    width: (state: RouteState): number => state.width
  }
}
