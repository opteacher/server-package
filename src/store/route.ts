import { Node, NodeInPnl, Route, CardWidth, ArrowHeight, Variable, CardGutter, CardHlfWid, CardHlfGutter, NodeTypeMapper, CardMinHgt, ArrowHlfHgt } from '@/common'
import { reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { EditNodeMapper } from '@/views/Flow'
import { Dispatch } from 'vuex'
import { uuid } from 'uuidv4'

type NodesInPnl = { [key: string]: NodeInPnl }
type RouteState = {
  route: Route,
  nodes: NodesInPnl,
  width: number,
  node: Node,
  visible: boolean
}

function getKey (obj: { key: string } | string): string {
  return typeof obj === 'string' ? obj : obj.key
}

function getNextKeys (node: Node): string[] {
  if (node.nexts.length) {
    if (typeof node.nexts[0] === 'string') {
      return node.nexts as string[]
    } else {
      return node.nexts.map((nxt: any) => nxt.key)
    }
  }
  return []
}

function getNode (state: { nodes: NodesInPnl }, node: string | Node): NodeInPnl {
  return typeof node === 'string' ? state.nodes[node] : state.nodes[node.key]
}

function getPrevious (state: { nodes: NodesInPnl }, node: Node): Node {
  return (typeof node.previous === 'string'
    ? state.nodes[node.previous] : node.previous) as Node
}

export default {
  namespaced: true,
  state: () => ({
    route: new Route(),
    nodes: {} as NodesInPnl,
    width: 0,
    node: new Node(),
    visible: false
  } as RouteState),
  mutations: {
    SET_WIDTH (state: RouteState, width: number) {
      state.width = width
    },
    SET_ND_SIZE (state: RouteState, payload: { ndKey: string, size: [number, number] }) {
      state.nodes[payload.ndKey].size = payload.size
    },
    SET_NODE (state: RouteState, node?: Node) {
      if (!node) {
        node = new Node()
      }
      state.node.reset()
      Node.copy(node, state.node)
      if (state.node.previous && state.node.previous instanceof Node
      && state.node.previous.type === 'condition') { // 添加修改条件节点
        state.node.type = 'condNode'
        EditNodeMapper.operation.display = state.node.key !== ''
        EditNodeMapper.type.options = [{ title: '条件节点', value: 'condNode' }]
      } else if (state.node.type === 'endNode') { // 修改循环结束节点
        EditNodeMapper.operation.display = false
        EditNodeMapper.type.options = [{ title: '循环结束节点', value: 'endNode' }]
      } else if (state.node.key) { // 修改结束节点
        EditNodeMapper.operation.display = true
        EditNodeMapper.type.options = [{
          title: NodeTypeMapper[state.node.type],
          value: state.node.type
        }]
      } else { // 添加结束节点
        EditNodeMapper.operation.display = false
        EditNodeMapper.type.options = Object.entries(NodeTypeMapper).map(([key, val]) => ({
          title: val,
          value: key
        })).filter(item => {
          return item.value !== 'endNode'
            && item.value !== 'condNode'
        })
      }
      EditNodeMapper.inputs.dsKey = `route/nodes.${state.node.key}.inputs`
      EditNodeMapper.outputs.dsKey = `route/nodes.${state.node.key}.outputs`
      state.visible = true
    },
    SET_INVISIBLE (state: RouteState) {
      state.visible = false
    },
    RESET_NODE (state: RouteState) {
      state.node.reset()
    }
  },
  actions: {
    async refresh (
      { state, dispatch }: { state: RouteState, dispatch: Dispatch },
      payload?: { rid?: string, force?: boolean }
    ) {
      if (!payload) {
        payload = {}
      }
      if (typeof payload.force === 'undefined') {
        payload.force = true
      }
      Route.copy((await reqGet('route', payload.rid || state.route.key)).data, state.route)
      if (state && state.route.flow) {
        const rootKey = state.route.flow.key
        if (payload.force) {
          await dispatch('readNodes', rootKey)
        }
        await dispatch('buildNodes', { ndKey: rootKey, height: 0 })
        await dispatch('fillPlaceholder', rootKey)
        await dispatch('fixWidth')
      }
    },
    async fixWidth ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }) {
      let left = 0
      let right = 0
      for (const node of Object.values(state.nodes)) {
        if (node.posLT[0] < left) {
          left = node.posLT[0]
        }
        if (node.posLT[0] + node.size[0] > right) {
          right = node.posLT[0] + node.size[0]
        }
      }
      if (state.width < right - left) {
        state.width = right - left
        await dispatch('refresh', { force: false })
      }
    },
    async fillPlaceholder ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, key: string) {
      const node = state.nodes[key]
      for (let i = 0; i < node.nexts.length; ++i) {
        const nxt = node.nexts[i]
        const nxtNode = getNode(state, nxt)
        const height = nxtNode.posLT[1] - (node.posLT[1] + node.size[1])
        if (height > ArrowHeight) {
          node.btmSvgHgt = height - ArrowHlfHgt
        }
        await dispatch('fillPlaceholder', getKey(nxt))
      }
    },
    async readNodes ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, key: string) {
      if (!(key in state.nodes)) {
        state.nodes[key] = Object.assign(
          Node.copy((await reqGet('node', key)).data), {
            posLT: [-1, -1],
            size: [0, 0],
            btmSvgHgt: ArrowHlfHgt
          }
        ) as NodeInPnl
      } else {
        Node.copy(
          (await reqGet('node', key)).data, state.nodes[key]
        )
      }
      for (const nxtNode of state.nodes[key].nexts) {
        await dispatch('readNodes', getKey(nxtNode))
      }
    },
    async buildNodes (
      { state, dispatch }: { state: RouteState, dispatch: Dispatch },
      { ndKey, height }: { ndKey: string, height: number }
    ) {
      const node = state.nodes[ndKey]
      if (!node.previous) {
        node.posLT[0] = (state.width >> 1) - CardHlfWid
        node.posLT[1] = height
      } else if (node.type === 'endNode') {
        const relNode = state.nodes[node.relative]
        node.posLT[0] = relNode.posLT[0]
        let maxHeight = 0
        function traverse (node: NodeInPnl) {
          if (node.key === ndKey) {
            return
          }
          const height = node.posLT[1] + node.size[1] + ArrowHeight
          maxHeight = height > maxHeight ? height : maxHeight
          for (const nxt of node.nexts) {
            traverse(getNode(state, nxt))
          }
        }
        traverse(relNode)
        node.posLT[1] = maxHeight
      } else {
        const pvsNode = node.previous as Node
        const nexts = pvsNode.nexts
        const oddLen = nexts.length % 2
        const pvsLft = state.nodes[pvsNode.key].posLT[0]
          + (oddLen ? 0 : CardHlfWid + CardHlfGutter)
        const index = nexts.indexOf(node.key)
        const midIdx = (nexts.length - (oddLen ? 1 : 0)) >> 1
        const idxDif = index - midIdx
        node.posLT[0] = pvsLft
          // + (idxDif > 0 ? CardWidth : 0) //初始定位在中间节点的左边
          + idxDif * (CardWidth + CardGutter) // 加上当前节点与中间节点的距离
          // - (idxDif > 0 ? CardWidth : 0) // 如果是右边的节点，则此时定位在节点的右边，调整到左边
        node.posLT[1] = height
      }
      for (const nxtNode of node.nexts) {
        await dispatch('buildNodes', {
          ndKey: getKey(nxtNode),
          height: node.posLT[1] + node.size[1] + ArrowHeight
        })
      }
    },
    async saveNode ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, node: Node) {
      const options = { ignores: ['key', 'previous', 'nexts', 'inputs', 'outputs'] }
      if (node.key) { // 更新节点
        await reqPut('node', node.key, node, options)
        return dispatch('refresh')
      }
      //新增节点
      let tailNode = Node.copy((await reqPost('node', node, options)).data, node)
      switch (node.type) {
      case 'condNode': { // 对于条件节点，找出条件根节点对应的结束节点
        const rootNode = getPrevious(state, node)
        const endNode = state.nodes[rootNode.relative]
        await Promise.all([
          reqLink({
            parent: ['node', node.key],
            child: ['nexts', endNode.key]
          }),
          reqLink({
            parent: ['node', endNode.key],
            child: ['previous', node.key]
          })
        ])
        tailNode = endNode
      }
      break
      case 'condition': { // 对于条件根节点，在其后同时创建一个条件节点和结束节点
        const condNode = Node.copy((await reqPost('node', {
          title: '条件节点1',
          type: 'condNode'
        }, options)).data)
        await Promise.all([
          reqLink({
            parent: ['node', node.key],
            child: ['nexts', condNode.key]
          }),
          reqLink({
            parent: ['node', condNode.key],
            child: ['previous', node.key]
          }),
        ])
        const endNode = Node.copy((await reqPost('node', {
          title: '条件结束节点1',
          type: 'endNode',
          relative: node.key
        }, options)).data)
        await reqPut('node', node.key, { relative: endNode.key })
        await Promise.all([
          reqLink({
            parent: ['node', condNode.key],
            child: ['nexts', endNode.key]
          }),
          reqLink({
            parent: ['node', endNode.key],
            child: ['previous', condNode.key]
          })
        ])
        tailNode = endNode
      }
      break
      case 'traversal': { // 对于循环根节点，在其后同时创建一个结束节点
        const endNode = Node.copy((await reqPost('node', {
          title: '循环结束节点1',
          type: 'endNode',
          relative: node.key
        }, options)).data)
        await Promise.all([
          reqLink({
            parent: ['node', node.key],
            child: ['nexts', endNode.key]
          }),
          reqLink({
            parent: ['node', endNode.key],
            child: ['previous', node.key]
          })
        ])
        tailNode = endNode
      }
      break
      }
      if (!node.previous) {
        // 绑定根节点
        await reqLink({
          parent: ['route', state.route.key],
          child: ['flow', node.key]
        })
      } else {
        // 绑定非根节点
        const previous = Node.copy(
          (await reqGet('node', (node.previous as Node).key)).data
        )
        if (previous.type !== 'condition' && previous.nexts.length) {
          const nxtKey = (previous.nexts[0] as Node).key
          // 解绑
          await reqLink({
            parent: ['node', previous.key],
            child: ['nexts', nxtKey]
          }, false)
          // 为原来的子节点添加新父节点
          await Promise.all([
            reqLink({
              parent: ['node', tailNode.key],
              child: ['nexts', nxtKey]
            }),
            reqLink({
              parent: ['node', nxtKey],
              child: ['previous', tailNode.key]
            })
          ])
        }
        // 绑定
        await Promise.all([
          reqLink({
            parent: ['node', previous.key],
            child: ['nexts', node.key]
          }),
          reqLink({
            parent: ['node', node.key],
            child: ['previous', previous.key]
          })
        ])
      }
      await dispatch('refresh')
    },
    async clsNmlNode ({ state }: { state: RouteState }, key: string) {
      const node = state.nodes[key]
      // 删除节点的输入和输出
      for (const input of node.inputs) {
        const iptKey = getKey(input)
        await reqLink({
          parent: ['node', node.key],
          child: ['inputs', iptKey]
        }, false)
        await reqDelete('variable', iptKey)
      }
      for (const output of node.outputs) {
        const optKey = getKey(output)
        await reqLink({
          parent: ['node', node.key],
          child: ['outputs', optKey]
        }, false)
        await reqDelete('variable', optKey)
      }
    },
    async delNode ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, key: string) {
      if (!(key in state.nodes)) {
        return
      }
      const node = state.nodes[key]
      // 清空节点信息
      switch (node.type) {
      case 'normal':
        await dispatch('clsNmlNode', key)
      }
      // 解绑的节点和父节点的关系
      let pvsKey = ''
      if (node.previous) {
        const previous = node.previous as Node
        pvsKey = getKey(previous)
        await reqLink({
          parent: ['node', pvsKey],
          child: ['nexts', node.key]
        }, false)
      } else { // 删除根节点
        await reqLink({
          parent: ['route', state.route.key],
          child: ['flow', node.key]
        }, false)
      }
      // 删除节点的子节点或解绑子节点
      const nexts = [] as string[]
      if (node.type === 'condNode') {
        // 如果是条件节点或循环根节点，删除对应的块
        nexts.push(...await dispatch('delBlock', { node, orgKey: pvsKey }))
      } else if (node.type === 'traversal') {
        nexts.push(...await dispatch('delBlock', { node, orgKey: key }))
      } else if (node.type === 'condition') {
        // 如果是条件根节点，则依次删除其子条件节点
        for (const nxtKey of getNextKeys(node)) {
          await dispatch('delNode', nxtKey)
        }
      } else {
        // 如果是普通节点，则把其子节点依次连接到删除节点的父节点上（相当于跳过，类似链表删除）
        nexts.push(...getNextKeys(node))
      }
      if (pvsKey) {
        for (const nxtKey of nexts) {
          await Promise.all([
            reqLink({
              parent: ['node', nxtKey],
              child: ['previous', pvsKey]
            }),
            reqLink({
              parent: ['node', pvsKey],
              child: ['nexts', nxtKey]
            })
          ])
        }
      }
      // 最后删除节点自身
      delete state.nodes[key]
      await reqDelete('node', key)
      await dispatch('refresh')
    },
    async delBlock (
      { state, dispatch }: { state: RouteState, dispatch: Dispatch },
      payload: { node: Node, orgKey: string }
    ) {
      // 从该节点之后删除到与该节点对应的end节点（注意：不会删除起始节点）
      const ret = [] as string[]
      for (const nxtKey of getNextKeys(payload.node)) {
        const nxtNode = Node.copy(state.nodes[nxtKey])
        switch (nxtNode.type) {
        case 'endNode':
          if (nxtNode.relative === payload.orgKey) {
            return getNextKeys(nxtNode)
          }
        case 'normal':
        case 'condition':
        case 'condNode':
        case 'traversal':
          delete state.nodes[nxtKey]
          await reqDelete('node', nxtKey)
          ret.push(...await dispatch('delBlock', {
            node: nxtNode,
            orgKey: payload.orgKey
          }))
        }
      }
      return ret
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
    width: (state: RouteState): number => state.width,
    node: (state: RouteState) => (key: string): NodesInPnl => state.nodes[key],
    editNode: (state: RouteState): Node => state.node,
    visible: (state: RouteState): boolean => state.visible
  }
}
