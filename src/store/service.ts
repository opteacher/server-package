import {
  Node,
  NodeInPnl,
  Service,
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
  LstOpnType
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
import { EditNodeEmitter, EditNodeMapper, ApiMapper } from '@/views/Flow'
import axios from 'axios'
import { Dispatch } from 'vuex'
import router from '@/router'
import { notification } from 'ant-design-vue'
import { reactive } from 'vue'

type NodesInPnl = { [key: string]: NodeInPnl }
type Nodes = { [key: string]: Node }
type SvcState = {
  api: Service
  nodes: NodesInPnl
  width: number
  node: Node
  locVars: Variable[]
  apiVsb: boolean
  nodeVsb: boolean
  joinVsb: boolean
  tempVsb: boolean
  deps: { [name: string]: Dependency }
}

function getNextKeys(node: Node): string[] {
  if (node.nexts.length) {
    if (typeof node.nexts[0] === 'string') {
      return node.nexts as string[]
    } else {
      return node.nexts.map((nxt: any) => nxt.key)
    }
  }
  return []
}

function getNextNodes(state: { nodes: NodesInPnl }, node: Node): Node[] {
  if (node.nexts.length) {
    if (typeof node.nexts[0] === 'string') {
      return (node.nexts as string[]).map((nxtKey: string) => state.nodes[nxtKey])
    } else {
      return node.nexts as Node[]
    }
  }
  return []
}

function getNode(state: { nodes: NodesInPnl }, node: string | Node): NodeInPnl {
  return typeof node === 'string' ? state.nodes[node] : state.nodes[node.key]
}

function getPrevious(state: { nodes: NodesInPnl }, node: Node): Node {
  return (typeof node.previous === 'string' ? state.nodes[node.previous] : node.previous) as Node
}

function getLocVars(state: SvcState, nd: string | Node | null): Variable[] {
  if (!nd || !getKey(nd) || !(getKey(nd) in state.nodes)) {
    return []
  }
  const node = state.nodes[getKey(nd)]
  const ret = [] as Variable[]
  if (node.previous) {
    ret.push(...getLocVars(state, node.previous))
  }
  return ret.concat(node.outputs)
}

async function newDep(dep: any): Promise<Dependency> {
  const result = (await makeRequest(axios.get(`/server-package/api/v1/dep/name/${dep.name}`)))
    .result
  return Dependency.copy(!result || !result._id ? (await reqPost('dependency', dep)).data : result)
}

function scanNextss(
  state: { nodes: NodesInPnl },
  node: Node,
  rootKey: string
): {
  endNode: Node | null
  allNodes: Nodes
} {
  let endNode = null
  const allNodes = {} as Nodes
  for (const nxtNode of getNextNodes(state, node)) {
    if (nxtNode.type === 'endNode' && nxtNode.relative === rootKey) {
      return { endNode: nxtNode, allNodes }
    }
    allNodes[nxtNode.key] = nxtNode
    const ret = scanNextss(state, nxtNode, rootKey)
    for (const [key, node] of Object.entries(ret.allNodes)) {
      allNodes[key] = node
    }
    if (ret.endNode) {
      endNode = ret.endNode
    }
  }
  return { endNode, allNodes }
}

export default {
  namespaced: true,
  state: () =>
    ({
      api: new Service(),
      nodes: {} as NodesInPnl,
      width: 0,
      node: new Node(),
      locVars: [] as Variable[],
      apiVsb: false,
      nodeVsb: false,
      joinVsb: false,
      tempVsb: false,
      deps: {}
    } as SvcState),
  mutations: {
    SET_WIDTH(state: SvcState, width: number) {
      state.width = width
    },
    SET_ND_SIZE(state: SvcState, payload: { ndKey: string; size: [number, number] }) {
      state.nodes[payload.ndKey].size = payload.size
    },
    SET_NODE(state: SvcState, payload?: { node?: Node; viewOnly?: boolean }) {
      if (!payload) {
        payload = { node: new Node(), viewOnly: false }
      } else if (!payload.node) {
        payload.node = new Node()
      }
      state.node.reset()
      Node.copy(payload.node, state.node)
      if (
        state.node.previous &&
        state.node.previous instanceof Node &&
        state.node.previous.type === 'condition'
      ) {
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
        EditNodeMapper.inputs.mapper['value'].options = state.api.deps
          .map((dep: Dependency) => dep.exports)
          .flat()
          .map((exp: string, idx: number) =>
            Variable.copy({ key: idx.toString(), name: exp, type: 'Object' })
          )
          .concat(getLocVars(state, state.node.previous))
          .map((locVar: Variable) => ({
            label: locVar.name,
            value: locVar.name
          }))
      }
      EditNodeMapper.outputs.dsKey = `service/nodes.${state.node.key}.outputs`
      state.nodeVsb = true
      EditNodeEmitter.emit('viewOnly', payload.viewOnly)
    },
    SET_NODE_INVSB(state: SvcState) {
      state.nodeVsb = false
    },
    SET_API_VSB(state: SvcState, payload?: boolean) {
      state.apiVsb = typeof payload !== 'undefined' ? payload : false
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
      state.locVars = state.api.deps
        .map((dep: Dependency) => dep.exports)
        .flat()
        .map((exp: string, idx: number) =>
          Variable.copy({ key: idx.toString(), name: exp, type: 'Object' })
        )
        .concat(getLocVars(state, state.node.previous))
    },
    UPDATE_LOCVARS(state: SvcState, payload?: Node) {
      if (!payload) {
        state.locVars = []
      } else {
        state.locVars = state.api.deps
          .map((dep: Dependency) => dep.exports)
          .flat()
          .map((exp: string, idx: number) =>
            Variable.copy({ key: idx.toString(), name: exp, type: 'Object' })
          )
          .concat(getLocVars(state, payload.previous))
      }
    },
    RESET_STATE(state: SvcState) {
      state.api.reset()
      state.width = 0
      state.nodes = {}
      state.node.reset()
      state.locVars = []
    }
  },
  actions: {
    async refresh({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, force?: boolean) {
      if (!router.currentRoute.value.params.aid) {
        return
      }
      const aid = router.currentRoute.value.params.aid
      if (typeof force === 'undefined') {
        force = true
      }
      // @_@: 应为表单选择添加依赖
      if (!('WebModule' in state.deps) || !('DbModule' in state.deps)) {
        state.deps['WebModule'] = await newDep({
          name: 'WebModule',
          exports: ['params', 'query', 'body'],
          default: false
        })
        state.deps['DbModule'] = await newDep({
          name: 'DbModule',
          exports: ['db'],
          from: '../utils/index.js',
          default: false
        })
        state.deps['Crypto'] = await newDep({
          name: 'Crypto',
          exports: ['crypto'],
          from: 'crypto',
          default: true
        })
        state.deps['JsonWebToken'] = await newDep({
          name: 'JsonWebToken',
          exports: ['jwt'],
          from: 'jsonwebtoken',
          default: true
        })
        state.deps['UUID'] = await newDep({
          name: 'UUID',
          exports: ['v4'],
          from: 'uuid',
          default: false
        })
      }
      ApiMapper['deps'].options = Object.values(state.deps).map((dep: Dependency) =>
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
      const pid = router.currentRoute.value.params.pid
      const project = Project.copy((await reqGet('project', pid)).data)
      ApiMapper['path'].prefix = `/${project.name}`
      Service.copy((await reqGet('service', aid)).data, state.api)
      if (state && state.api.flow) {
        const rootKey = state.api.flow.key
        if (force) {
          await dispatch('readNodes', rootKey)
        }
        await dispatch('buildNodes', { ndKey: rootKey, height: 0 })
        await dispatch('fillPlaceholder', rootKey)
        await dispatch('fixWidth')
      }
      await dispatch('rfshTemps')
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
        await dispatch('refresh', { force: false })
      }
    },
    async fillPlaceholder(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      key: string
    ) {
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
    async readNodes({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, key: string) {
      if (!(key in state.nodes)) {
        state.nodes[key] = Object.assign(Node.copy((await reqGet('node', key)).data), {
          posLT: [-1, -1],
          size: [0, 0],
          btmSvgHgt: ArrowHlfHgt
        }) as NodeInPnl
      } else {
        Node.copy((await reqGet('node', key)).data, state.nodes[key])
      }
      for (const nxtNode of state.nodes[key].nexts) {
        await dispatch('readNodes', getKey(nxtNode))
      }
    },
    async buildNodes(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      { ndKey, height }: { ndKey: string; height: number }
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
        const pvsLft = state.nodes[pvsNode.key].posLT[0] + (oddLen ? 0 : CardHlfWid + CardHlfGutter)
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
      for (const nxtNode of node.nexts) {
        await dispatch('buildNodes', {
          ndKey: getKey(nxtNode),
          height: node.posLT[1] + node.size[1] + ArrowHeight
        })
      }
    },
    async saveNode({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, node: Node) {
      const options = { ignores: ['key', 'previous', 'nexts', 'inputs', 'outputs'] }
      if (node.key) {
        // 更新节点
        await reqPut('node', node.key, node, options)
        return dispatch('rfshNode')
      }
      //新增节点
      const orgNode = Node.copy(node)
      let tailNode = Node.copy((await reqPost('node', node, options)).data, node)
      const nodeKey = tailNode.key
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
        case 'condNode':
          {
            // 对于条件节点，找出条件根节点对应的结束节点
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
        case 'condition':
          {
            // 对于条件根节点，在其后同时创建一个条件节点和结束节点
            const condNode = Node.copy(
              (
                await reqPost(
                  'node',
                  {
                    title: `条件节点${node.nexts.length + 1}`,
                    type: 'condNode'
                  },
                  options
                )
              ).data
            )
            await Promise.all([
              reqLink({
                parent: ['node', nodeKey],
                child: ['nexts', condNode.key]
              }),
              reqLink({
                parent: ['node', condNode.key],
                child: ['previous', nodeKey]
              })
            ])
            const endNode = Node.copy(
              (
                await reqPost(
                  'node',
                  {
                    title: node.title,
                    type: 'endNode',
                    relative: nodeKey
                  },
                  options
                )
              ).data
            )
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
        case 'traversal':
          {
            // 对于循环根节点，在其后同时创建一个结束节点
            const endNode = Node.copy(
              (
                await reqPost(
                  'node',
                  {
                    title: node.title,
                    type: 'endNode',
                    relative: nodeKey
                  },
                  options
                )
              ).data
            )
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
          parent: ['service', state.api.key],
          child: ['flow', nodeKey]
        })
      } else {
        // 绑定非根节点
        const previous = Node.copy((await reqGet('node', (node.previous as Node).key)).data)
        if (previous.type !== 'condition' && previous.nexts.length) {
          const nxtKey = (previous.nexts[0] as Node).key
          // 解绑
          await reqLink(
            {
              parent: ['node', previous.key],
              child: ['nexts', nxtKey]
            },
            false
          )
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
    async clrNmlNode({ state }: { state: SvcState }, key: string) {
      const node = state.nodes[key]
      // 删除节点的输入和输出
      for (const input of node.inputs) {
        const iptKey = getKey(input)
        await reqLink(
          {
            parent: ['node', node.key],
            child: ['inputs', iptKey]
          },
          false
        )
        await reqDelete('variable', iptKey)
      }
      for (const output of node.outputs) {
        const optKey = getKey(output)
        await reqLink(
          {
            parent: ['node', node.key],
            child: ['outputs', optKey]
          },
          false
        )
        await reqDelete('variable', optKey)
      }
    },
    async delNode({ state, dispatch }: { state: SvcState; dispatch: Dispatch }, key: string) {
      if (!(key in state.nodes)) {
        return
      }
      const node = state.nodes[key]
      // 清空节点信息
      await dispatch('clrNmlNode', key)
      if (!node.isTemp) {
        // 解绑的节点和父节点的关系
        let pvsKey = ''
        if (node.previous) {
          const previous = node.previous as Node
          pvsKey = getKey(previous)
          await reqLink(
            {
              parent: ['node', pvsKey],
              child: ['nexts', node.key]
            },
            false
          )
        } else {
          // 删除根节点
          await reqLink(
            {
              parent: ['service', state.api.key],
              child: ['flow', node.key]
            },
            false
          )
        }
        // 删除节点的子节点或解绑子节点
        const nexts = [] as string[]
        switch (node.type) {
          case 'condNode':
            {
              // 如果是条件节点或循环根节点，删除对应的块
              const endNode = Node.copy(
                await dispatch('delBlock', {
                  node,
                  rootKey: pvsKey,
                  delRoot: false,
                  delEnd: false
                })
              )
              if (state.nodes[pvsKey].nexts.length === 1) {
                await reqLink({
                  parent: ['node', pvsKey],
                  child: ['nexts', endNode.key]
                })
              }
            }
            break
          case 'traversal':
            {
              const endNode = Node.copy(
                await dispatch('delBlock', {
                  node,
                  rootKey: key,
                  delRoot: false,
                  delEnd: true
                })
              )
              nexts.push(...getNextKeys(endNode))
            }
            break
          case 'condition':
            {
              // 如果是条件根节点，则依次删除其子条件节点
              const endNxtKeys = [] as string[]
              const nxtNodes = getNextNodes(state, node)
              if (nxtNodes.length === 1 && nxtNodes[0].type === 'endNode') {
                // 如果条件根节点直接接着结束节点，则删除节点并把结束节点的子节点抛出去
                nexts.push(...getNextKeys(nxtNodes[0]))
                const endKey = nxtNodes[0].key
                delete state.nodes[endKey]
                await reqDelete('node', endKey)
                break
              }
              for (let i = 0; i < nxtNodes.length; ++i) {
                const nxtNode = nxtNodes[i]
                const endNode = Node.copy(
                  await dispatch('delBlock', {
                    node: nxtNode,
                    rootKey: node.key,
                    delRoot: true,
                    delEnd: i === nxtNodes.length - 1
                  })
                )
                endNxtKeys.push(...getNextKeys(endNode))
                await reqLink(
                  {
                    parent: ['node', node.key],
                    child: ['nexts', nxtNode.key]
                  },
                  false
                )
              }
              // 结束节点后的子节点接到该节点下
              nexts.push(...Array.from(new Set(endNxtKeys)))
            }
            break
          default:
            // 如果是普通节点，则把其子节点依次连接到删除节点的父节点上（相当于跳过，类似链表删除）
            nexts.push(...getNextKeys(node))
            break
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
    async delBlock(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      payload: { node: Node; rootKey: string; delRoot?: boolean; delEnd?: boolean }
    ) {
      const clsNode = async (ndKey: string) => {
        await dispatch('clrNmlNode', ndKey)
        delete state.nodes[ndKey]
        await reqDelete('node', ndKey)
      }
      // 从该节点之后删除到与该节点对应的end节点（注意：不会删除起始节点）
      // 先收集所有需要删除的节点
      const nxtss = scanNextss(state, payload.node, payload.rootKey)
      for (const node of Object.values(nxtss.allNodes)) {
        await clsNode(node.key)
      }
      const endNode = nxtss.endNode as Node
      if (payload.delRoot) {
        await clsNode(payload.node.key)
      } else {
        // 清空rootNode所有子节点，并将endNode的子节点全部变为rootNode
        for (const nxtKey of getNextKeys(payload.node)) {
          await reqLink(
            {
              parent: ['node', payload.node.key],
              child: ['nexts', nxtKey]
            },
            false
          )
        }
        if (payload.delEnd) {
          for (const nxtKey of getNextKeys(endNode)) {
            await reqLink({
              parent: ['node', payload.node.key],
              child: ['nexts', nxtKey]
            })
          }
        } else {
          await reqLink({
            parent: ['node', payload.node.key],
            child: ['nexts', endNode.key]
          })
        }
      }
      if (payload.delEnd) {
        // 清空删除endNode
        await clsNode(endNode.key)
      }
      return endNode
    },
    async rfshNode({ state }: { state: SvcState }, key?: string) {
      const nkey = key || state.node.key
      Node.copy((await reqGet('node', nkey)).data, state.nodes[nkey])
      if (!key) {
        Node.copy(state.nodes[nkey], state.node)
      }
    },
    async saveInOutput(
      { state, dispatch }: { state: SvcState; dispatch: Dispatch },
      payload: { name: string; edited: Variable }
    ) {
      if (!payload.edited.key) {
        const addIOpt = Variable.copy((await reqPost('variable', payload.edited)).data)
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
        ).result.length
      ) {
        notification.error({
          message: '加入模板库错误！',
          description: '模板库已有相应节点存在，如需修改，点击模板节点库查看修改'
        })
        return
      }
      const tempNode = Node.copy(
        (
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
        ).result
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
            ).data._id
          ]
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
    async rfshTemps({ state }: { state: SvcState }) {
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
    ins: (state: SvcState): Service => state.api,
    nodes: (state: SvcState): NodesInPnl => {
      return Object.fromEntries(Object.entries(state.nodes).filter(([_key, node]) => !node.isTemp))
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
    apiVsb: (state: SvcState): boolean => state.apiVsb,
    tempNodes: (state: SvcState): Node[] => {
      return Object.values(state.nodes).filter((nd: any) => nd.isTemp)
    },
    tempVsb: (state: SvcState): boolean => state.tempVsb,
    deps: (state: SvcState): Dependency[] => state.api.deps,
    tempGrps: () => (EditNodeMapper['temp'].options as OpnType[]).map(reactive)
  }
}
