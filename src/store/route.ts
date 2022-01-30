import {
  Node,
  NodeInPnl,
  Route,
  CardWidth,
  ArrowHeight,
  Variable,
  CardGutter,
  CardHlfWid,
  CardHlfGutter,
  NodeTypeMapper,
  ArrowHlfHgt,
  Project,
  Dependency,
  OpnType,
} from '@/common'
import {
  reqDelete,
  reqGet,
  reqLink,
  reqPost,
  reqPut,
  getKey,
  makeRequest,
  skipIgnores
} from '@/utils'
import { EditNodeEmitter, EditNodeMapper, RouteMapper } from '@/views/Flow'
import axios from 'axios'
import { Dispatch } from 'vuex'
import router from '@/router'
import { notification } from 'ant-design-vue'
import { reactive } from 'vue'

type NodesInPnl = { [key: string]: NodeInPnl }
type Nodes = { [key: string]: Node }
type RouteState = {
  route: Route,
  nodes: NodesInPnl,
  width: number,
  node: Node,
  locVars: Variable[],
  routeVsb: boolean,
  nodeVsb: boolean,
  joinVsb: boolean,
  tempVsb: boolean,
  deps: { [name: string]: string[] }
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

function getLocVars (state: RouteState, nd: string | Node | null): Variable[] {
  if (!nd) {
    return []
  }
  const node = state.nodes[getKey(nd)]
  const ret = [] as Variable[]
  if (node.previous) {
    ret.push(...getLocVars(state, node.previous))
  }
  return ret.concat(node.outputs)
}

async function newDep (name: string, exports: string[]): Promise<string> {
  const resp = (await makeRequest(axios.get(
    `/server-package/api/v1/dep/name/${name}`
  ))).data
  const dep = new Dependency()
  if (!resp || !resp._id) {
    Dependency.copy((await reqPost('dependency', { name, exports })).data, dep)
  }
  return dep.key
}

export default {
  namespaced: true,
  state: () => ({
    route: new Route(),
    nodes: {} as NodesInPnl,
    width: 0,
    node: new Node(),
    locVars: [] as Variable[],
    routeVsb: false,
    nodeVsb: false,
    joinVsb: false,
    tempVsb: false,
    deps: {}
  } as RouteState),
  mutations: {
    SET_WIDTH (state: RouteState, width: number) {
      state.width = width
    },
    SET_ND_SIZE (state: RouteState, payload: { ndKey: string, size: [number, number] }) {
      state.nodes[payload.ndKey].size = payload.size
    },
    SET_NODE (state: RouteState, payload?: { node?: Node, viewOnly?: boolean }) {
      if (!payload) {
        payload = { node: new Node(), viewOnly: false }
      } else if (!payload.node) {
        payload.node = new Node()
      }
      state.node.reset()
      Node.copy(payload.node, state.node)
      if (state.node.previous && state.node.previous instanceof Node
      && state.node.previous.type === 'condition') { // 添加修改条件节点
        state.node.type = 'condNode'
        EditNodeMapper.delete.display = state.node.key !== ''
        EditNodeMapper.type.options = [{ label: '条件节点', value: 'condNode' }]
      } else if (state.node.type === 'endNode') { // 修改循环结束节点
        EditNodeMapper.delete.display = false
        EditNodeMapper.type.options = [{ label: '循环结束节点', value: 'endNode' }]
      } else if (state.node.key) { // 修改结束节点
        EditNodeMapper.delete.display = true
        EditNodeMapper.type.options = [{
          label: NodeTypeMapper[state.node.type],
          value: state.node.type
        }]
      } else { // 添加结束节点
        EditNodeMapper.delete.display = false
        EditNodeMapper.type.options = Object.entries(NodeTypeMapper).map(([key, val]) => ({
          label: val,
          value: key
        })).filter(item => item.value !== 'endNode' && item.value !== 'condNode')
      }
      EditNodeMapper.inputs.dsKey = `route/nodes.${state.node.key}.inputs`
      if (EditNodeMapper.inputs.mapper) {
        EditNodeMapper.inputs.mapper['value'].options = getLocVars(state, state.node.previous)
          .concat(Variable.copy({ key: '0', name: 'params', type: 'Object' }))
          .concat(Variable.copy({ key: '1', name: 'query', type: 'Object' }))
          .concat(Variable.copy({ key: '2', name: 'body', type: 'Object' }))
          .map((locVar: Variable) => ({
            label: locVar.name, value: locVar.name
          }))
      }
      EditNodeMapper.outputs.dsKey = `route/nodes.${state.node.key}.outputs`
      state.nodeVsb = true
      EditNodeEmitter.emit('viewOnly', payload.viewOnly)
    },
    SET_NODE_INVSB (state: RouteState) {
      state.nodeVsb = false
    },
    SET_ROUTE_VSB (state: RouteState, payload?: boolean) {
      state.routeVsb = typeof payload !== 'undefined' ? payload : false
    },
    RESET_NODE (state: RouteState) {
      state.node.reset()
    },
    SET_JOIN_VSB (state: RouteState, payload?: boolean) {
      state.joinVsb = typeof payload !== 'undefined' ? payload : false
    },
    SET_TEMP_VSB (state: RouteState, payload?: boolean) {
      state.tempVsb = typeof payload !== 'undefined' ? payload : false
    },
    UPD_EDT_LOCVARS (state: RouteState) {
      state.locVars = getLocVars(state, state.node.previous)
        .concat(Variable.copy({ key: '0', name: 'params', type: 'Object' }))
        .concat(Variable.copy({ key: '1', name: 'query', type: 'Object' }))
        .concat(Variable.copy({ key: '2', name: 'body', type: 'Object' }))
    },
    UPDATE_LOCVARS (state: RouteState, payload?: Node) {
      if (!payload) {
        state.locVars = []
      } else {
        state.locVars = getLocVars(state, payload.previous)
          .concat(Variable.copy({ key: '0', name: 'params', type: 'Object' }))
          .concat(Variable.copy({ key: '1', name: 'query', type: 'Object' }))
          .concat(Variable.copy({ key: '2', name: 'body', type: 'Object' }))
      }
    }
  },
  actions: {
    async refresh (
      { state, dispatch }: { state: RouteState, dispatch: Dispatch }, force?: boolean
    ) {
      if (!router.currentRoute.value.params.rid) {
        return
      }
      const rid = router.currentRoute.value.params.rid
      if (typeof force === 'undefined') {
        force = true
      }
      const pid = router.currentRoute.value.params.pid
      const project = Project.copy((await reqGet('project', pid)).data)
      RouteMapper['path'].prefix = `/${project.name}`
      Route.copy((await reqGet('route', rid)).data, state.route)
      if (state && state.route.flow) {
        const rootKey = state.route.flow.key
        if (force) {
          await dispatch('readNodes', rootKey)
        }
        await dispatch('buildNodes', { ndKey: rootKey, height: 0 })
        await dispatch('fillPlaceholder', rootKey)
        await dispatch('fixWidth')
      } else {
        state.nodes = {}
        state.node.reset()
      }
    },
    async fixWidth ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }) {
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
      for (const dep of state.nodes[key].deps) {
        if (!(dep.name in state.deps)) {
          state.deps[dep.name] = dep.exports
        }
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
        const traverse = (node: NodeInPnl) => {
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
        return dispatch('rfshNode')
      }
      //新增节点
      const orgNode = Node.copy(node)
      const modKeys = []
      if (!node.previous) {
        modKeys.push(await newDep('WebModule', ['params', 'query', 'body']))
        modKeys.push(await newDep('DbModule', ['db']))
      }
      let tailNode = Node.copy((await reqPost('node', node, options)).data, node)
      const nodeKey = tailNode.key
      for (const modKey of modKeys) {
        await reqLink({
          parent: ['node', nodeKey],
          child: ['deps', modKey]
        })
      }
      // 如果是从模板节点复制过来，则应该有inputs和outputs
      for (const input of orgNode.inputs) {
        const newIpt = (await reqPost('variable', input)).data
        await reqLink({
          parent: ['node', nodeKey],
          child: ['inputs', newIpt._id]
        })
      }
      for (const output of orgNode.outputs) {
        const newOpt = (await reqPost('variable', output)).data
        await reqLink({
          parent: ['node', nodeKey],
          child: ['outputs', newOpt._id]
        })
      }
      switch (node.type) {
      case 'condNode': { // 对于条件节点，找出条件根节点对应的结束节点
        const rootNode = getPrevious(state, node)
        const endNode = state.nodes[rootNode.relative]
        await Promise.all([
          reqLink({
            parent: ['node', nodeKey],
            child: ['nexts', endNode.key]
          }),
          reqLink({
            parent: ['node', endNode.key],
            child: ['previous', nodeKey]
          })
        ])
        tailNode = endNode
      }
      break
      case 'condition': { // 对于条件根节点，在其后同时创建一个条件节点和结束节点
        const condNode = Node.copy((await reqPost('node', {
          title: `条件节点${node.nexts.length + 1}`,
          type: 'condNode'
        }, options)).data)
        await Promise.all([
          reqLink({
            parent: ['node', nodeKey],
            child: ['nexts', condNode.key]
          }),
          reqLink({
            parent: ['node', condNode.key],
            child: ['previous', nodeKey]
          }),
        ])
        const endNode = Node.copy((await reqPost('node', {
          title: node.title,
          type: 'endNode',
          relative: nodeKey
        }, options)).data)
        await reqPut('node', nodeKey, { relative: endNode.key })
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
          title: node.title,
          type: 'endNode',
          relative: nodeKey
        }, options)).data)
        await reqPut('node', nodeKey, { relative: endNode.key })
        await Promise.all([
          reqLink({
            parent: ['node', nodeKey],
            child: ['nexts', endNode.key]
          }),
          reqLink({
            parent: ['node', endNode.key],
            child: ['previous', nodeKey]
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
          child: ['flow', nodeKey]
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
            child: ['nexts', nodeKey]
          }),
          reqLink({
            parent: ['node', nodeKey],
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
      await dispatch('clsNmlNode', key)
      if (!node.isTemp) {
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
        if (nxtNode.type === 'endNode'
        && nxtNode.relative === payload.orgKey) {
          return getNextKeys(nxtNode)
        }
        delete state.nodes[nxtKey]
        await reqDelete('node', nxtKey)
        ret.push(...await dispatch('delBlock', {
          node: nxtNode,
          orgKey: payload.orgKey
        }))
      }
      return ret
    },
    async rfshNode ({ state }: { state: RouteState }, key?: string) {
      const nkey = key || state.node.key
      Node.copy((await reqGet('node', nkey)).data, state.nodes[nkey])
      if (!key) {
        Node.copy(state.nodes[nkey], state.node)
      }
    },
    async saveInOutput (
      { state, dispatch }: { state: RouteState, dispatch: Dispatch },
      payload: { name: string, edited: Variable }
    ) {
      if (!payload.edited.key) {
        const addIOpt = Variable.copy(
          (await reqPost('variable', payload.edited)).data
        )
        await reqLink({
          parent: ['node', state.node.key],
          child: [`${payload.name}s`, addIOpt.key]
        })
      } else {
        await reqPut('variable', payload.edited.key, payload.edited)
      }
      await dispatch('rfshNode')
    },
    async delInOutput (
      { state, dispatch }: { state: RouteState, dispatch: Dispatch },
      payload: { name: string, delKey: string }
    ) {
      await reqLink({
        parent: ['node', state.node.key],
        child: [`${payload.name}s`, payload.delKey]
      }, false)
      await reqDelete('variable', payload.delKey)
      await dispatch('rfshNode')
    },
    async joinLibrary ({ state, dispatch }: { state: RouteState, dispatch: Dispatch }, group: string) {
      const baseURL = '/server-package/api/v1/node/temp'
      // 组和标题与数据库中模板节点相等的，判定为不可入库
      if ((await makeRequest(axios.get(`${baseURL}/exists`, {
        params: { group, title: state.node.title }
      }))).result.length) {
        notification.error({
          message: '加入模板库错误！',
          description: '模板库已有相应节点存在，如需修改，点击模板节点库查看修改',
        })
        return
      }
      const tempNode = Node.copy((await makeRequest(
        axios.post(baseURL, Object.assign(skipIgnores(state.node, [
          'key', 'inputs', 'outputs', 'nexts', 'previous', 'relative', 'deps'
        ]), { group, isTemp: true })),
      )).result)
      for (const input of state.node.inputs) {
        await reqLink({
          parent: ['node', tempNode.key],
          child: ['inputs', (await reqPost('variable', input, {
            ignores: ['value', 'prop']
          })).data._id]
        })
      }
      for (const output of state.node.outputs) {
        await reqLink({
          parent: ['node', tempNode.key],
          child: ['outputs', (await reqPost('variable', output)).data._id]
        })
      }
      state.joinVsb = false
      await reqPut('node', state.node.key, { group })
      await dispatch('rfshTemps')
      await dispatch('rfshNode')
    },
    async rfshTemps ({ state }: { state: RouteState }) {
      const resp = await makeRequest(axios.get('/server-package/api/v1/node/temps'))
      for (const node of resp.result.map((tmpNd: any) => Node.copy(tmpNd))) {
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
        children: nodes ? (nodes as any[]).map((node: any) => ({
          label: node.title,
          value: node.key
        })) : []
      }))
    }
  },
  getters: {
    ins: (state: RouteState): Route => state.route,
    nodes: (state: RouteState): NodesInPnl => {
      return Object.fromEntries(Object.entries(state.nodes)
        .filter(([_key, node]) => !node.isTemp))
    },
    width: (state: RouteState): number => state.width,
    node: (state: RouteState) => (key: string): NodesInPnl => state.nodes[key],
    editNode: (state: RouteState): Node => state.node,
    nodeVsb: (state: RouteState): boolean => state.nodeVsb,
    locVars: (state: RouteState) => state.locVars,
    joinVsb: (state: RouteState): boolean => state.joinVsb,
    routeVsb: (state: RouteState): boolean => state.routeVsb,
    tempNodes: (state: RouteState): Node[] => {
      return Object.values(state.nodes).filter((nd: any) => nd.isTemp)
    },
    tempVsb: (state: RouteState): boolean => state.tempVsb,
    deps: (state: RouteState): Dependency[] => {
      return Object.entries(state.deps)
        .map(([name, exports]) => Dependency.copy({ name, exports }))
    },
    tempGrps: () => (EditNodeMapper['temp'].options as OpnType[]).map(reactive)
  }
}
