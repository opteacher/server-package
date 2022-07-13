/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from '../models/node.js'
import Service from '../models/service.js'
import { db, pickOrIgnore } from '../utils/index.js'

export function tempNodes() {
  return db.select(Node, { isTemp: true }, { ext: true })
}

export function newTemp(node) {
  return db.save(Node, pickOrIgnore(node, ['previous', 'nexts']))
}

export function tempByGrpAndTtl(group, title) {
  return db.select(Node, { group, title, isTemp: true }, { ext: true })
}

export async function bindPtCdNodes(parent, child) {
  return Promise.all([
    db.saveOne(Node, parent, { nexts: child }, { updMode: 'append' }),
    db.saveOne(Node, child, { previous: parent }, { updMode: 'append' })
  ])
}

export async function save(node, sid) {
  const deps = node.deps ? node.deps.map(dep => dep.id || dep) : []
  if (node.key) {
    // 覆盖依赖
    await db.saveOne(Node, node.key, { deps })
    // 更新节点
    return db.saveOne(Node, node.key, pickOrIgnore(node, ['key', 'previous', 'nexts', 'deps']))
  }
  //新增节点
  node = await db.save(Node, pickOrIgnore(node, ['key']))
  const nodeKey = node.id
  let tailNode = node
  // 覆盖依赖
  await db.saveOne(Node, nodeKey, { deps })
  switch (node.ntype) {
    case 'condNode':
      {
        // 对于条件节点，找出条件根节点对应的结束节点
        const rootNode = await db.select(Node, { _index: node.previous })
        const endNode = await db.select(Node, { _index: rootNode.relative })
        await bindPtCdNodes(nodeKey, endNode.id)
        tailNode = endNode
      }
      break
    case 'condition':
      {
        // 对于条件根节点，在其后同时创建一个条件节点和结束节点
        const condNode = await db.save(Node, {
          title: `条件节点${node.nexts.length + 1}`,
          ntype: 'condNode'
        })

        await bindPtCdNodes(nodeKey, condNode.id)
        const endNode = await db.save(Node, {
          title: node.title,
          ntype: 'endNode',
          relative: nodeKey
        })
        await db.saveOne(Node, nodeKey, { relative: endNode.id })
        await bindPtCdNodes(condNode.id, endNode.id)
        tailNode = endNode
      }
      break
    case 'traversal':
      {
        // 根据循环类型，生成输入和输出（只支持for-of）
        await db.saveOne(
          Node,
          nodeKey,
          {
            inputs: {
              name: 'array',
              vtype: 'Array',
              required: true,
              remark: '集合'
            },
            outputs: {
              name: 'item',
              vtype: 'Any',
              required: true,
              remark: '索引'
            }
          },
          { updMode: 'append' }
        )
        // 对于循环根节点，在其后同时创建一个结束节点
        const endNode = await db.save(Node, {
          title: node.title,
          ntype: 'endNode',
          relative: nodeKey
        })
        await db.saveOne(Node, nodeKey, { relative: endNode.id })
        await bindPtCdNodes(nodeKey, endNode.id)
        tailNode = endNode
      }
      break
  }
  if (!node.previous) {
    // 绑定根节点
    await db.saveOne(Service, sid, { flow: nodeKey }, { updMode: 'append' })
  } else {
    // 绑定非根节点
    const previous = await db.select(Node, { _index: node.previous.key || node.previous })
    if (previous.ntype !== 'condition' && previous.nexts.length) {
      const nxtKey = previous.nexts[0]
      // 解绑
      await db.saveOne(Node, previous.id, { nexts: nxtKey }, { updMode: 'delete' })
      // 为原来的子节点添加新父节点
      await bindPtCdNodes(tailNode.id, nxtKey)
    }
    // 绑定
    await bindPtCdNodes(previous.id, nodeKey)
  }
  return node
}

export async function del(nid, sid) {
  const node = await db.select(Node, { _index: nid })
  if (!node) {
    return
  }
  if (!node.isTemp) {
    // 解绑的节点和父节点的关系
    let pvsKey = ''
    if (node.previous) {
      pvsKey = node.previous
      await db.saveOne(Node, pvsKey, { nexts: node.id }, { updMode: 'delete' })
    } else {
      // 删除根节点
      await db.saveOne(Service, sid, { flow: node.id }, { updMode: 'delete' })
    }
    // 删除节点的子节点或解绑子节点
    const nexts = []
    switch (node.ntype) {
      case 'condNode':
        {
          // 如果是条件节点或循环根节点，删除对应的块
          const endNode = await delBlock(node, pvsKey.toString(), false, false)
          const rootNode = await db.select(Node, { _index: pvsKey })
          if (!rootNode.nexts.length) {
            await db.saveOne(Node, pvsKey, { nexts: endNode.id }, { updMode: 'append' })
          }
        }
        break
      case 'traversal':
        {
          const endNode = await delBlock(node, nid.toString(), false, true)
          nexts.push(...endNode.nexts)
        }
        break
      case 'condition':
        {
          // 如果是条件根节点，则依次删除其子条件节点
          const endNxtKeys = []
          const nxtNodes = await Promise.all(
            node.nexts.map(nxtKey => db.select(Node, { _index: nxtKey }))
          )
          if (nxtNodes.length === 1 && nxtNodes[0].ntype === 'endNode') {
            // 如果条件根节点直接接着结束节点，则删除节点并把结束节点的子节点抛出去
            nexts.push(...nxtNodes[0].nexts)
            const endKey = nxtNodes[0].id
            await db.remove(Node, { _index: endKey })
            break
          }
          for (let i = 0; i < nxtNodes.length; ++i) {
            const nxtNode = nxtNodes[i]
            const endNode = await delBlock(
              nxtNode,
              node.id.toString(),
              true,
              i === nxtNodes.length - 1
            )

            endNxtKeys.push(...endNode.nexts)
            await db.saveOne(Node, node.id, { nexts: nxtNode.id }, { updMode: 'delete' })
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
    } else {
      await db.saveOne(Service, sid, { flow: nexts[0] })
    }
  }
  // 最后删除节点自身
  return db.remove(Node, { _index: nid })
}

/**
 *
 * @param {*} node
 * @param {*} rootKey
 * @returns {
            endNode: NodeType | null
            allNodes: Record<string, NodeType>
          }
 */
export async function scanNextss(node, rootKey) {
  let endNode = null
  const allNodes = {}
  for (const nxtKey of node.nexts) {
    const nxtNode = await db.select(Node, { _index: nxtKey })
    if (nxtNode.ntype === 'endNode' && nxtNode.relative === rootKey) {
      return { endNode: nxtNode, allNodes }
    }
    allNodes[nxtNode.id] = nxtNode
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

async function delBlock(node, rootKey, delRoot, delEnd) {
  // 从该节点之后删除到与该节点对应的end节点（注意：不会删除起始节点）
  // 先收集所有需要删除的节点
  const nxtss = await scanNextss(node, rootKey)
  for (const node of Object.values(nxtss.allNodes)) {
    await db.remove(Node, { _index: node.id })
  }
  const endNode = nxtss.endNode
  if (delRoot) {
    await db.remove(Node, { _index: node.id })
  } else {
    // 清空rootNode所有子节点，并将endNode的子节点全部变为rootNode
    for (const nxtKey of node.nexts) {
      await db.saveOne(Node, node.id, { nexts: nxtKey }, { updMode: 'delete' })
    }
    if (delEnd) {
      for (const nxtKey of endNode.nexts) {
        await db.saveOne(Node, node.id, { nexts: nxtKey }, { updMode: 'append' })
      }
    } else {
      await db.saveOne(Node, node.id, { nexts: endNode.id }, { updMode: 'append' })
    }
  }
  if (delEnd) {
    // 清空删除endNode
    await db.remove(Node, { _index: endNode.id })
  }
  return endNode
}
