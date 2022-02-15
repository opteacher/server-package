/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from '../models/node.js'
import NodeType from '../types/Node.js'
import Variable from '../models/variable.js'
import VarType from '../types/variable.js'
import Service from '../models/service.js'
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

async function bindPtCdNodes(parent: string, child: string) {
  return Promise.all([
    db.save(Node, { nexts: child }, { _index: parent }, { updMode: 'append' }),
    db.save(Node, { previous: parent }, { _index: child }, { updMode: 'append' })
  ])
}

export async function save(sid: string, node: NodeType) {
  const options = { ignores: ['key', 'previous', 'nexts', 'inputs', 'outputs', 'deps'] }
  if (node.key) {
    // 覆盖依赖
    await db.save(
      Node,
      { deps: node.deps.map(dep => dep.key) },
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
    { deps: node.deps.map(dep => dep.key) },
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
        // 根据循环类型，生成输入和输出
        if (node.loop === 'for-in') {
          const index = VarType.copy(
            await db.save(Variable, {
              name: 'index',
              type: 'Number',
              required: true,
              remark: '集合项'
            })
          )
          await db.save(Node, { outputs: index.key }, { _index: nodeKey }, { updMode: 'append' })
        } else if (node.loop === 'for-of') {
          const item = VarType.copy(
            await db.save(Variable, {
              name: 'item',
              type: 'Any',
              required: true,
              remark: '索引'
            })
          )
          await db.save(Node, { outputs: item.key }, { _index: nodeKey }, { updMode: 'append' })
        }
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
}
