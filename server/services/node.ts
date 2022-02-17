/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from '../models/node.js'
import NodeType from '../types/node.js'
import Variable from '../models/variable.js'
import VarType from '../types/variable.js'
import Service from '../models/service.js'
import DepType from '../types/dep.js'
import { db, skipIgnores } from '../utils/index.js'

export function tempNodes() {
  return db.select(Node, { isTemp: true }, { ext: true })
}

export function newTemp(node: any): Promise<any> {
  return db.save(Node, skipIgnores(node, ['previous', 'nexts']))
}

export function tempByGrpAndTtl(group: string, title: string): Promise<any> {
  return db.select(Node, { group, title, isTemp: true }, { ext: true })
}

export async function bindPtCdNodes(parent: string, child: string) {
  return Promise.all([
    db.save(Node, { nexts: child }, { _index: parent }, { updMode: 'append' }),
    db.save(Node, { previous: parent }, { _index: child }, { updMode: 'append' })
  ])
}

export async function save(node: NodeType, sid?: string) {
  const options = { ignores: ['key', 'previous', 'nexts', 'inputs', 'outputs', 'deps'] }
  if (node.key) {
    // 覆盖依赖
    await db.save(
      Node,
      { deps: node.deps.map((dep: DepType) => dep.key) },
      { _index: node.key },
      { updMode: 'cover' }
    )
    // 更新节点
    return db.save(Node, skipIgnores(node, options.ignores), { _index: node.key })
  }
  //新增节点
  const orgNode = NodeType.copy(node)
  let tailNode = NodeType.copy(await db.save(Node, skipIgnores(node, options.ignores)), node)
  const nodeKey = tailNode.key
  // 如果是从模板节点复制过来，则应该有inputs和outputs
  for (const input of orgNode.inputs) {
    const newIpt = await db.save(Variable, input)
    await db.save(Node, { inputs: newIpt.id }, { _index: nodeKey }, { updMode: 'append' })
  }
  for (const output of orgNode.outputs) {
    const newOpt = await db.save(Variable, output)
    await db.save(Node, { outputs: newOpt.id }, { _index: nodeKey }, { updMode: 'append' })
  }
  // 覆盖依赖
  await db.save(
    Node,
    { deps: orgNode.deps.map((dep: DepType) => dep.key) },
    { _index: nodeKey },
    { updMode: 'cover' }
  )
  switch (node.type) {
    case 'condNode':
      {
        // 对于条件节点，找出条件根节点对应的结束节点
        const rootNode = NodeType.copy(await db.select(Node, { _index: node.previous as string }))
        const endNode = NodeType.copy(await db.select(Node, { _index: rootNode.relative }))
        await bindPtCdNodes(nodeKey, endNode.key)
        tailNode = endNode
      }
      break
    case 'condition':
      {
        // 对于条件根节点，在其后同时创建一个条件节点和结束节点
        const condNode = NodeType.copy(
          await db.save(Node, {
            title: `条件节点${node.nexts.length + 1}`,
            type: 'condNode'
          })
        )
        await bindPtCdNodes(nodeKey, condNode.key)
        const endNode = NodeType.copy(
          await db.save(Node, {
            title: node.title,
            type: 'endNode',
            relative: nodeKey
          })
        )
        await db.save(Node, { relative: endNode.key }, { _index: nodeKey })
        await bindPtCdNodes(condNode.key, endNode.key)
        tailNode = endNode
      }
      break
    case 'traversal':
      {
        const list = VarType.copy(
          await db.save(Variable, {
            name: 'array',
            type: 'Array',
            required: true,
            remark: '集合'
          })
        )
        await db.save(Node, { inputs: list.key }, { _index: nodeKey }, { updMode: 'append' })
        // 根据循环类型，生成输入和输出（只支持for-of）
        const item = VarType.copy(
          await db.save(Variable, {
            name: 'item',
            type: 'Any',
            required: true,
            remark: '索引'
          })
        )
        await db.save(Node, { outputs: item.key }, { _index: nodeKey }, { updMode: 'append' })
        // 对于循环根节点，在其后同时创建一个结束节点
        const endNode = NodeType.copy(
          await db.save(Node, {
            title: node.title,
            type: 'endNode',
            relative: nodeKey
          })
        )
        await db.save(Node, { relative: endNode.key }, { _index: nodeKey })
        await bindPtCdNodes(nodeKey, endNode.key)
        tailNode = endNode
      }
      break
  }
  if (!node.previous) {
    // 绑定根节点
    await db.save(Service, { flow: nodeKey }, { _index: sid }, { updMode: 'append' })
  } else {
    // 绑定非根节点
    const previous = NodeType.copy(await db.select(Node, { _index: node.previous }))
    if (previous.type !== 'condition' && previous.nexts.length) {
      const nxtKey = previous.nexts[0]
      // 解绑
      await db.save(Node, { nexts: nxtKey }, { _index: previous.key }, { updMode: 'delete' })
      // 为原来的子节点添加新父节点
      await bindPtCdNodes(tailNode.key, nxtKey)
    }
    // 绑定
    await bindPtCdNodes(previous.key, nodeKey)
  }
  return node
}

export async function clear(ndKey: string | NodeType) {
  let node: NodeType = new NodeType()
  if (typeof ndKey === 'string') {
    NodeType.copy(await db.select(Node, { _index: ndKey }), node)
  } else {
    node = ndKey as NodeType
  }
  // 删除节点的输入和输出
  for (const iptKey of node.inputs) {
    await db.save(Node, { inputs: iptKey }, { _index: node.key }, { updMode: 'delete' })
    await db.del(Variable, { _index: iptKey })
  }
  for (const optKey of node.outputs) {
    await db.save(Node, { inputs: optKey }, { _index: node.key }, { updMode: 'delete' })
    await db.del(Variable, { _index: optKey })
  }
}

export async function del(nid: string, sid?: string) {
  const node = NodeType.copy(await db.select(Node, { _index: nid }, { ext: true }))
  if (!node) {
    return
  }
  // 清空节点信息
  await clear(node)
  if (!node.isTemp) {
    // 解绑的节点和父节点的关系
    let pvsKey = ''
    if (node.previous) {
      pvsKey = node.previous
      await db.save(Node, { nexts: node.key }, { _index: pvsKey }, { updMode: 'delete' })
    } else {
      // 删除根节点
      await db.save(Service, { flow: node.key }, { _index: sid }, { updMode: 'delete' })
    }
    // 删除节点的子节点或解绑子节点
    const nexts = [] as string[]
    switch (node.type) {
      case 'condNode':
        {
          // 如果是条件节点或循环根节点，删除对应的块
          const endNode = NodeType.copy(await delBlock(node, pvsKey, false, false))
          const rootNode = NodeType.copy(await db.select(Node, { _index: pvsKey }))
          if (rootNode.nexts.length === 1) {
            await db.save(Node, { nexts: endNode.key }, { _index: pvsKey }, { updMode: 'append' })
          }
        }
        break
      case 'traversal':
        {
          const endNode = NodeType.copy(await delBlock(node, nid, false, true))
          nexts.push(...endNode.nexts)
        }
        break
      case 'condition':
        {
          // 如果是条件根节点，则依次删除其子条件节点
          const endNxtKeys = [] as string[]
          const nxtNodes = await Promise.all(
            node.nexts.map((nxtKey: string) =>
              db.select(Node, { _index: nxtKey }).then((res: any) => NodeType.copy(res))
            )
          )
          if (nxtNodes.length === 1 && nxtNodes[0].type === 'endNode') {
            // 如果条件根节点直接接着结束节点，则删除节点并把结束节点的子节点抛出去
            nexts.push(...nxtNodes[0].nexts)
            const endKey = nxtNodes[0].key
            await db.del(Node, { _index: endKey })
            break
          }
          for (let i = 0; i < nxtNodes.length; ++i) {
            const nxtNode = nxtNodes[i]
            const endNode = NodeType.copy(
              await delBlock(nxtNode, node.key, true, i === nxtNodes.length - 1)
            )
            endNxtKeys.push(...endNode.nexts)
            await db.save(Node, { nexts: nxtNode.key }, { _index: node.key }, { updMode: 'delete' })
          }
          // 结束节点后的子节点接到该节点下
          nexts.push(...Array.from(new Set(endNxtKeys)))
        }
        break
      default:
        // 如果是普通节点，则把其子节点依次连接到删除节点的父节点上（相当于跳过，类似链表删除）
        nexts.push(...node.nexts)
        break
    }
    if (pvsKey) {
      for (const nxtKey of nexts) {
        await bindPtCdNodes(pvsKey, nxtKey)
      }
    }
  }
  // 最后删除节点自身
  return db.del(Node, { _index: nid })
}

export async function scanNextss(
  node: NodeType,
  rootKey: string
): Promise<{
  endNode: NodeType | null
  allNodes: Record<string, NodeType>
}> {
  let endNode = null
  const allNodes = {} as Record<string, NodeType>
  for (const nxtKey of node.nexts) {
    const nxtNode = NodeType.copy(await db.select(Node, { _index: nxtKey }))
    if (nxtNode.type === 'endNode' && nxtNode.relative === rootKey) {
      return { endNode: nxtNode, allNodes }
    }
    allNodes[nxtNode.key] = nxtNode
    const ret = await scanNextss(nxtNode, rootKey)
    for (const [key, node] of Object.entries(ret.allNodes)) {
      allNodes[key] = node
    }
    if (ret.endNode) {
      endNode = ret.endNode
    }
  }
  return { endNode, allNodes }
}

async function delBlock(node: NodeType, rootKey: string, delRoot?: boolean, delEnd?: boolean) {
  const clsNode = async (ndKey: string) => {
    await clear(ndKey)
    // delete state.nodes[ndKey]
    await db.del(Node, { _index: ndKey })
  }
  // 从该节点之后删除到与该节点对应的end节点（注意：不会删除起始节点）
  // 先收集所有需要删除的节点
  const nxtss = await scanNextss(node, rootKey)
  for (const node of Object.values(nxtss.allNodes)) {
    await clsNode(node.key)
  }
  const endNode = nxtss.endNode as NodeType
  if (delRoot) {
    await clsNode(node.key)
  } else {
    // 清空rootNode所有子节点，并将endNode的子节点全部变为rootNode
    for (const nxtKey of node.nexts) {
      await db.save(Node, { nexts: nxtKey }, { _index: node.key }, { updMode: 'delete' })
    }
    if (delEnd) {
      for (const nxtKey of endNode.nexts) {
        await db.save(Node, { nexts: nxtKey }, { _index: node.key }, { updMode: 'append' })
      }
    } else {
      await db.save(Node, { nexts: endNode.key }, { _index: node.key }, { updMode: 'append' })
    }
  }
  if (delEnd) {
    // 清空删除endNode
    await clsNode(endNode.key)
  }
  return endNode
}
