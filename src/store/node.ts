/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { depAPI, ndAPI, svcAPI, typAPI } from '@/apis'
import router from '@/router'
import Dep from '@/types/dep'
import NodeInPnl from '@/types/ndInPnl'
import Node, { NodeTypeMapper, ndTpOpns } from '@/types/node'
import Service from '@/types/service'
import { Func } from '@/types/typo'
import { depExp } from '@/utils'
import { nodeEmitter, nodeMapper } from '@/views/Flow'
import { flatten } from 'lodash'
import { Dispatch } from 'vuex'

export type NodesInPnl = { [key: string]: NodeInPnl }
type NodeState = {
  service: Service
  typFun: Func
  nodes: NodesInPnl
  width: number
  editing: Node
  deps: Dep[]
  subNode: Node
}

export default {
  namespaced: true,
  state: () =>
    ({
      service: new Service(),
      typFun: new Func(),
      nodes: {} as NodesInPnl,
      width: 0,
      editing: new Node(),
      deps: [],
      subNode: new Node()
    }) as NodeState,
  mutations: {
    SET_NODE(state: NodeState, payload?: { key?: string; previous?: string; viewOnly?: boolean }) {
      // 更新依赖选项到表单
      nodeEmitter.emit('update:mprop', {
        'advanced.items.deps.lblMapper': Object.fromEntries(
          state.deps.map(dep => [dep.key, dep.name])
        ),
        'advanced.items.deps.mapper.data.options': state.deps.map(dep => ({
          key: dep.key,
          title: dep.name,
          subTitle: `import ${depExp(dep)} from '${dep.from}'`
        }))
      })
      // 新增节点
      if (!payload || (!payload.key && !payload.previous)) {
        nodeEmitter.emit('update:mprop', {
          'ntype.options': ndTpOpns.filter(
            item => item.value !== 'endNode' && item.value !== 'condNode'
          )
        })
        nodeEmitter.emit('update:visible', true)
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
        nodeMapper.ntype.options = [{ label: '条件节点', value: 'condNode' }]
      } else if (state.editing.ntype === 'endNode') {
        // 修改循环结束节点
        nodeMapper.ntype.options = [{ label: '循环结束节点', value: 'endNode' }]
      } else if (state.editing.key) {
        // 修改结束节点
        nodeMapper.ntype.options = [
          {
            label: NodeTypeMapper[state.editing.ntype],
            value: state.editing.ntype
          }
        ]
      } else {
        // 添加结束节点
        nodeMapper.ntype.options = ndTpOpns.filter(
          item => item.value !== 'endNode' && item.value !== 'condNode'
        )
      }
      nodeEmitter.emit('update:mprop', {
        'ntype.options': nodeMapper.ntype.options
      })
      // 含子节点更新函数名编辑框
      const enable = state.editing.ntype === 'subNode' && state.editing.isFun
      nodeEmitter.emit('update:mprop', {
        'advanced.items.subFun.display': enable,
        'advanced.items.subFun.rules[0].required': enable
      })
      nodeEmitter.emit('update:visible', {
        show: true,
        viewOnly: payload.viewOnly,
        object: state.editing
      })
    },
    RESET_STATE(state: NodeState) {
      state.service.reset()
      state.typFun.reset()
      state.editing.reset()
      state.width = 0
      state.nodes = {}
    }
  },
  actions: {
    async setSubNid(
      { state, dispatch }: { state: NodeState; dispatch: Dispatch },
      subNid?: string
    ) {
      if (subNid) {
        state.subNode = state.nodes[subNid]
      } else {
        state.subNode.reset()
      }
      await dispatch('refresh', { force: true })
    },
    async refresh(
      { state }: { state: NodeState },
      params?: {
        force?: boolean
        onlyIns?: boolean
        width?: number
        updNodes?: [string, 'save' | 'delete'][]
      }
    ) {
      if (!params) {
        params = { force: false, width: 0, updNodes: [] }
      }
      const routeParams = router.currentRoute.value.params
      let flowKey = ''
      if (state.subNode.key) {
        flowKey = state.subNode.relative
      } else if (routeParams.sid) {
        state.service = await svcAPI.detail(routeParams.sid as string)
        state.typFun.reset()
        flowKey = state.service.flow ? state.service.flow.key : ''
      } else if (routeParams.tid) {
        const typo = await typAPI.get(routeParams.tid as string)
        state.typFun = typo.funcs.find((func: Func) => func.key === routeParams.fid)
        state.service.reset()
        flowKey = state.typFun.flow as string
      } else {
        return
      }
      if (params.onlyIns) {
        return
      }
      if (params.force || (!state.service.flow && !state.typFun.flow)) {
        state.deps = await Promise.all([depAPI.all(), depAPI.allByPjt()]).then(res => flatten(res))
      }
      if (params.width) {
        state.width = params.width
      }
      if (state.service.flow || state.typFun.flow) {
        if (params.updNodes) {
          for (const [ndKey, opera] of params.updNodes) {
            switch (opera) {
              case 'save':
                state.nodes[ndKey] = await ndAPI.detail(ndKey)
                if (state.nodes[ndKey].ntype !== 'subNode' && state.nodes[ndKey].relative) {
                  const relKey = state.nodes[ndKey].relative
                  state.nodes[relKey] = await ndAPI.detail(relKey)
                }
                if (state.nodes[ndKey].ntype === 'condition') {
                  const nxtNd = state.nodes[ndKey].nexts[0]
                  const nxtKey = (nxtNd as any).key || nxtNd
                  state.nodes[nxtKey] = await ndAPI.detail(nxtKey)
                  const relKey = state.nodes[ndKey].relative
                  state.nodes[relKey] = await ndAPI.detail(relKey)
                }
                break
              case 'delete':
                {
                  const ndKeys = [ndKey]
                  if (state.nodes[ndKey].ntype !== 'subNode' && state.nodes[ndKey].relative) {
                    for (
                      let nd = state.nodes[ndKey];
                      nd.nexts.length && nd.nexts[0] !== state.nodes[ndKey].relative;
                      nd = state.nodes[nd.nexts[0]]
                    ) {
                      ndKeys.push(...nd.nexts)
                    }
                    ndKeys.push(state.nodes[ndKey].relative)
                  }
                  for (const key of ndKeys) {
                    delete state.nodes[key]
                  }
                }
                break
            }
          }
        } else if (params.force) {
          console.log(await ndAPI.all(flowKey))
          state.nodes = flowKey
            ? Object.fromEntries(
                await ndAPI
                  .all(flowKey)
                  .then(nodes => nodes.map(node => [node.key, NodeInPnl.copy(node)]))
              )
            : {}
        }
        if (!flowKey) {
          return
        }
        for (const ndInPnl of await svcAPI.flow.build(flowKey, state.width)) {
          const node = state.nodes[ndInPnl.key]
          node.posLT = ndInPnl.posLT
          node.btmSvgHgt = ndInPnl.btmSvgHgt
        }
      } else {
        state.nodes = {}
        state.editing.reset()
      }
    }
  },
  getters: {
    service: (state: NodeState): Service => state.service,
    typFun: (state: NodeState): Func => state.typFun,
    svcKey: (state: NodeState): string => state.service.key,
    funKey: (state: NodeState): string => state.typFun.key,
    nodes: (state: NodeState): NodesInPnl => state.nodes,
    width: (state: NodeState): number => state.width,
    node:
      (state: NodeState) =>
      (key: string): NodeInPnl =>
        state.nodes[key],
    editNode: (state: NodeState): Node => state.editing,
    edtNdKey: (state: NodeState): string => state.editing.key,
    subNdKey: (state: NodeState): string => state.subNode.key,
    subNode: (state: NodeState): Node => state.subNode,
    subNdTtl: (state: NodeState): string => state.subNode.title
  }
}
