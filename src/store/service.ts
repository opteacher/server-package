/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { depAPI, ndAPI, svcAPI } from '@/apis'
import router from '@/router'
import Dep from '@/types/dep'
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
  deps: Dep[]
}

export default {
  namespaced: true,
  state: () =>
    ({
      service: new Service(),
      nodes: {} as NodesInPnl,
      width: 0,
      editing: new Node(),
      deps: []
    } as SvcState),
  mutations: {
    SET_NODE(state: SvcState, payload?: { key?: string; previous?: string; viewOnly?: boolean }) {
      // 更新依赖选项到表单
      const depExp = (dep: Dep) => (dep.default ? dep.exports[0] : `{ ${dep.exports.join(', ')} }`)
      edtNdEmitter.emit('update:mprop', {
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
    async refresh(
      { state }: { state: SvcState },
      params?: { force?: boolean; width?: number; updNodes?: [string, 'save' | 'delete'][] }
    ) {
      if (!params) {
        params = { force: false, width: 0, updNodes: [] }
      }
      if (!router.currentRoute.value.params.sid) {
        return
      }
      const sid = router.currentRoute.value.params.sid as string
      if (params.force || !state.service.flow) {
        state.service = await svcAPI.detail(sid)
        state.deps = await depAPI.all()
      }
      if (params.width) {
        state.width = params.width
      }
      if (state.service.flow) {
        if (params.updNodes) {
          for (const [ndKey, opera] of params.updNodes) {
            if (opera === 'save') {
              state.nodes[ndKey] = await ndAPI.detail(ndKey)
            } else if (opera === 'delete') {
              delete state.nodes[ndKey]
            }
          }
        } else if (params.force) {
          state.nodes = Object.fromEntries(
            (await ndAPI.all(sid)).map(node => [node.key, NodeInPnl.copy(node)])
          )
        }
        for (const ndInPnl of await svcAPI.node.build(sid, state.width)) {
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
