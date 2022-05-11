import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { db } from '../utils/index.js'
import { save, del } from '../services/node.js'
import Service from '../models/service.js'
import Node from '../models/node.js'

describe('# 节点服务', () => {
  let sid = ''
  let nd1Id = ''
  let nd2Id = ''
  let nd3Id = ''
  let nd4Id = ''
  let nd5Id = ''
  let nd6Id = ''
  beforeAll(async () => {
    await db.sync(Service)
    await db.sync(Node)
    const service = await db.save(Service, {
      name: 'service',
      interface: 'test',
      emit: 'api',
      isModel: false,
      method: 'GET',
      path: '/abcd/api/v1/test'
    })
    sid = service.id
  })
  describe('# 实际节点', () => {
    describe('# 增加节点', () => {
      test('# 创建节点（根节点）', async () => {
        const node = await save(
          {
            title: 'node1',
            desc: 'Hello Node1',
            ntype: 'normal',
            inputs: [
              {
                name: 'input1',
                vtype: 'String',
                value: 'abcd',
                remark: 'Hello Input1'
              }
            ],
            outputs: [
              {
                name: 'output1',
                value: 'ret'
              }
            ],
            isFun: true,
            code: "const output1 = 'Hello ' + input1"
          },
          sid
        )
        expect(node.id).not.toBeUndefined()
        const service = await db.select(Service, { _index: sid })
        expect(service.flow.toString()).toEqual(node.id)
        nd1Id = node.id
      })

      test('# 创建节点', async () => {
        const node = await save({
          title: 'node2',
          desc: 'Hello Node2',
          ntype: 'normal',
          inputs: [
            {
              name: 'input1',
              vtype: 'Object',
              value: 'ret',
              remark: 'Hello Input1'
            }
          ],
          code: 'console.log(input1)',
          previous: nd1Id
        })
        expect(node.id).not.toBeUndefined()
        const previous = await db.select(Node, { _index: nd1Id })
        expect(previous.nexts.map(nxtId => nxtId.toString())).toContain(node.id)
        nd2Id = node.id
      })

      test('# 创建节点（插入）', async () => {
        let node1 = await db.select(Node, { _index: nd1Id })
        const nd1OrgNxts = node1.nexts
        const node = await save({
          title: 'node3',
          desc: 'Hello Node3',
          ntype: 'normal',
          outputs: [
            {
              name: 'output1',
              value: 'a',
              remark: 'Hello Input1'
            }
          ],
          code: 'const a = 128',
          isFun: false,
          previous: nd1Id
        })
        expect(node.id).not.toBeUndefined()
        nd3Id = node.id
        node1 = await db.select(Node, { _index: nd1Id })
        expect(node1.nexts.map(nxtId => nxtId.toString())).toContain(node.id)
        const node3 = await db.select(Node, { _index: node.id })
        expect(node3.previous.toString()).toEqual(node1.id)
        expect(node3.nexts).toEqual(nd1OrgNxts)
      })

      test('# 创建节点（条件根节点）', async () => {
        const node = await save({
          title: 'node4',
          desc: 'Hello Node4',
          ntype: 'condition',
          previous: nd2Id
        })
        const node4 = await db.select(Node, { _index: node.id })
        expect(node4.id).not.toBeUndefined()
        nd4Id = node4.id
        expect(node4.relative).not.toBeUndefined()
        expect(node4.relative).not.toEqual('')
        expect(node4.nexts.length).toBeGreaterThan(0)

        const condNode = await db.select(Node, { _index: node4.nexts[0] })
        expect(condNode.ntype).toEqual('condNode')
        expect(condNode.nexts.length).toBeGreaterThan(0)
        expect(condNode.nexts[0].toString()).toEqual(node4.relative)

        const endNode = await db.select(Node, { _index: node4.relative })
        expect(endNode.ntype).toEqual('endNode')
        expect(endNode.relative).toEqual(node4.id)
      })

      test('# 添加节点（条件节点）', async () => {
        const node = await save({
          title: 'node5',
          desc: 'Hello Node5',
          ntype: 'condNode',
          previous: nd4Id
        })
        const node5 = await db.select(Node, { _index: node.id })
        expect(node5.id).not.toBeUndefined()
        nd5Id = node5.id
        expect(node5.nexts.length).toBeGreaterThan(0)

        const rootNode = await db.select(Node, { _index: nd4Id })
        expect(rootNode.nexts.length).toBeGreaterThan(1)
        expect(rootNode.relative.toString()).toEqual(node5.nexts[0].toString())
      })

      test('# 创建节点（循环节点）', async () => {
        const node = await save({
          title: 'node6',
          desc: 'Hello Node6',
          ntype: 'traversal',
          previous: nd2Id
        })
        const node6 = await db.select(Node, { _index: node.id })
        expect(node6.id).not.toBeUndefined()
        nd6Id = node.id
        expect(node6.nexts.length).toBeGreaterThan(0)

        const endNode = await db.select(Node, { _index: node6.nexts[0] })
        expect(endNode.ntype).toEqual('endNode')
        expect(endNode.relative.toString()).toEqual(node6.id)
        expect(node6.relative.toString()).toEqual(endNode.id)
      })
    })

    describe('# 修改节点', () => {
      test('# 修改节点', async () => {
        const node = await save({
          key: nd2Id,
          desc: 'Hello Node2, Im O.P'
        })
        expect(node.desc).toEqual('Hello Node2, Im O.P')
      })
    })

    describe('# 删除节点', () => {
      test('# 非根节点', async () => {
        let node3 = await db.select(Node, { _index: nd3Id })
        const nxts = node3.nexts
        await del(nd3Id)
        const node1 = await db.select(Node, { _index: nd1Id })
        expect(node1.nexts).toEqual(nxts)
        const nxt1 = await db.select(Node, { _index: nxts[0] })
        expect(nxt1.previous.toString()).toEqual(node1.id)
        node3 = await db.select(Node, { _index: nd3Id })
        expect(node3).toBeNull()
      })

      test('# 根节点', async () => {
        let node1 = await db.select(Node, { _index: nd1Id })
        const nxtKey = node1.nexts[0].toString()
        await del(nd1Id, sid)
        const service = await db.select(Service, { _index: sid })
        expect(service.flow.toString()).toEqual(nxtKey)
        node1 = await db.select(Node, { _index: nd1Id })
        expect(node1).toBeNull()
      })

      test('# 条件节点', async () => {
        let node5 = await db.select(Node, { _index: nd5Id })
        const rootKey = node5.previous
        await del(nd5Id)
        const rootNode = await db.select(Node, { _index: rootKey })
        expect(rootNode.nexts.map(key => key.toString())).not.toContain(nd5Id)
        node5 = await db.select(Node, { _index: nd5Id })
        expect(node5).toBeNull()
      })

      test('# 条件根节点', async () => {
        let node4 = await db.select(Node, { _index: nd4Id })
        const pvsKey = node4.previous
        const endKey = node4.relative
        await del(nd4Id)
        const pvsNode = await db.select(Node, { _index: pvsKey })
        expect(pvsNode.nexts.map(key => key.toString())).not.toContain(nd4Id)
        node4 = await db.select(Node, { _index: nd4Id })
        expect(node4).toBeNull()
        const endNode = await db.select(Node, { _index: endKey })
        expect(endNode).toBeNull()
      })

      test('# 循环节点', async () => {
        let node6 = await db.select(Node, { _index: nd6Id })
        const pvsKey = node6.previous
        const endKey = node6.relative
        await del(nd6Id)
        const pvsNode = await db.select(Node, { _index: pvsKey })
        expect(pvsNode.nexts.map(key => key.toString())).not.toContain(nd6Id)
        node6 = await db.select(Node, { _index: nd6Id })
        expect(node6).toBeNull()
        const endNode = await db.select(Node, { _index: endKey })
        expect(endNode).toBeNull()
      })
    })
  })

  // describe('# 模板节点', () => {
  //   // @_@
  // })
})
