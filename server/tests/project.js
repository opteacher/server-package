import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { sync, stopSync, status, del, transfer, getAllAPIs, runAll } from '../services/project.js'
import { db } from '../utils/index.js'
import Path from 'path'
import { execSync } from 'child_process'
import Project from '../models/project.js'
import Database from '../models/database.js'
import Model from '../models/model.js'
import Service from '../models/service.js'
import Node from '../models/node.js'

jest.setTimeout(300000)

describe('# 项目服务', () => {
  let pid = ''
  beforeAll(async () => {
    await db.sync(Database)
    await db.sync(Project)
    await db.sync(Model)
    await db.sync(Service)
    await db.sync(Node)
    await db.save(Database, {
      name: 'mongo',
      dbs: ['test'],
      host: '81.69.34.148',
      port: 27017,
      username: 'root',
      password: '12345'
    })

    const project = await db.save(Project, {
      name: 'abcd',
      desc: '12345',
      port: 2000,
      database: ['mongo', 'test'],
      dropDbs: true,
      commands: 'echo "Hello World"'
    })
    pid = project._id

    const model = await db.save(Model, {
      name: 'model1',
      desc: 'Hello Model',
      logTime: true,
      props: [
        {
          name: 'aaaa',
          label: '测试测试',
          ptype: 'String',
          index: true,
          unique: true,
          visible: true,
          remark: 'Im a teacher'
        }
      ],
      form: {
        title: '测试测试项目表单',
        width: 300,
        labelWidth: 80,
        fields: [
          {
            label: '测试测试',
            desc: 'Im a teacher',
            ftype: 'Input', // 参考CompoType
            rules: [],
            refer: '@aaaa', // 关联字段或字段的再处理，当然也可以为空（为单字段时，该组件与字段双向绑定）
            extra: 'oooo'
          }
        ]
      },
      table: {
        title: '测试测试项目表',
        desc: 'Im a teacher',
        operaStyle: '',
        size: '',
        hasPages: true,
        columns: [
          {
            title: '测试测试',
            dataIndex: 'aaaa',
            width: 100,
            align: 'left', // left | right | center
            sortable: false,
            defaultSort: 'descend', // | ascend | descend
            searchable: false,
            filterable: false
          }
        ],
        operable: [] // 可增加, 可编辑, 可删除
      }
    })
    await db.saveOne(Project, pid, { models: model.id }, { updMode: 'append' })

    const service1 = await db.save(Service, {
      model: 'model1',
      emit: 'api',
      isModel: true,
      method: 'POST'
    })
    await db.saveOne(Model, model.id, { svcs: service1.id }, { updMode: 'append' })

    const service2 = await db.save(Service, {
      name: 'service2',
      interface: 'test',
      emit: 'api',
      isModel: false,
      method: 'GET',
      path: '/abcd/api/v1/test'
    })
    await db.saveOne(Model, model.id, { svcs: service2.id }, { updMode: 'append' })

    const node1 = await db.save(Node, {
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
      code: 'const output1 = \'Hello \' + input1'
    })
    await db.saveOne(Service, service2.id, { flow: node1.id })

    // 转折节点
    const node2 = await db.save(Node, {
      title: 'node2',
      desc: 'Hello Node2',
      ntype: 'condition'
    })
    await db.saveOne(Node, node1.id, { nexts: node2.id }, { updMode: 'append'})
    await db.saveOne(Node, node2.id, { previous: node1.id })

    const node3 = await db.save(Node, {
      title: 'node3',
      desc: 'Hello Node3',
      ntype: 'condNode',
      inputs: [
        {
          name: 'input1',
          vtype: 'Object',
          value: 'ret',
          remark: 'Hello Input1'
        }
      ],
      isFun: false,
      code: 'input1 === \'abcd\''
    })
    await db.saveOne(Node, node2.id, { nexts: node3.id }, { updMode: 'append'})
    await db.saveOne(Node, node3.id, { previous: node2.id })

    const node4 = await db.save(Node, {
      title: 'node4',
      desc: 'Hello Node4',
      ntype: 'normal',
      inputs: [
        {
          name: 'input1',
          vtype: 'Object',
          value: 'ret',
          remark: 'Hello Input1'
        }
      ],
      isFun: false,
      code: 'console.log(input1)'
    })
    await db.saveOne(Node, node3.id, { nexts: node4.id }, { updMode: 'append'})
    await db.saveOne(Node, node4.id, { previous: node3.id })

    const node5 = await db.save(Node, {
      title: 'node5',
      desc: 'Hello Node5',
      ntype: 'endNode',
      isFun: false,
      relative: node2.id
    })
    await db.saveOne(Node, node2.id, { relative: node5.id })
    await db.saveOne(Node, node4.id, { nexts: node5.id }, { updMode: 'append'})
    await db.saveOne(Node, node5.id, { previous: node4.id })

    const node6 = await db.save(Node, {
      title: 'node6',
      desc: 'Hello Node6',
      ntype: 'traversal',
      inputs: [
        {
          name: 'input1',
          vtype: 'Array',
          value: [12, 34, 56, 78],
          remark: 'Hello Input1'
        }
      ],
      outputs: [
        {
          name: 'item',
          vtype: 'Object',
          remark: 'Hello Output1'
        }
      ],
      isFun: false,
    })
    await db.saveOne(Node, node5.id, { nexts: node6.id }, { updMode: 'append'})
    await db.saveOne(Node, node6.id, { previous: node5.id })

    const node7 = await db.save(Node, {
      title: 'node7',
      desc: 'Hello Node7',
      ntype: 'normal',
      inputs: [
        {
          name: 'input1',
          vtype: 'Object',
          value: 'item',
          remark: 'Hello Input1'
        }
      ],
      isFun: false,
      code: 'console.log(input1)'
    })
    await db.saveOne(Node, node6.id, { nexts: node7.id }, { updMode: 'append'})
    await db.saveOne(Node, node7.id, { previous: node6.id })

    const node8 = await db.save(Node, {
      title: 'node8',
      desc: 'Hello Node8',
      ntype: 'endNode',
      isFun: false,
      relative: node6.id
    })
    await db.saveOne(Node, node6.id, { relative: node8.id })
    await db.saveOne(Node, node7.id, { nexts: node8.id }, { updMode: 'append'})
    await db.saveOne(Node, node8.id, { previous: node7.id })

    const node9 = await db.save(Node, {
      title: 'node9',
      desc: 'Hello Node9',
      ntype: 'normal',
      inputs: [
        {
          name: 'input1',
          vtype: 'Object',
          value: 'output1',
          remark: 'Hello Input1'
        }
      ],
      isFun: false,
      code: 'return ret'
    })
    await db.saveOne(Node, node8.id, { nexts: node9.id }, { updMode: 'append'})
    await db.saveOne(Node, node9.id, { previous: node8.id })
  })

  test('# getAllAPIs', async () => {
    for (const api of await getAllAPIs(pid)) {
      if (api.model && api.model === 'service1') {
        expect(api).toHaveProperty('method', 'POST')
        expect(api).toHaveProperty('path', '/abcd/mdl/v1/model1')
      }
      if (api.svc && api.svc === 'service2') {
        expect(api).toHaveProperty('method', 'GET')
        expect(api).toHaveProperty('path', '/abcd/api/v1/test')
      }
    }
  })

  test('# sync', async () => {
    expect(await sync(pid)).not.toBeUndefined()
  })

  test('# status', async () => {
    let result = await status(pid)
    for (let i = 0; i < 30 || result.status.stat === 'loading'; ++i) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      result = await status(pid)
    }
    expect(result.status.stat).toEqual('running')
  })

  test('# transfer', async () => {
    await transfer({
      pid,
      files: [
        {
          src: Path.resolve('public/abcd.txt'),
          dest: '/public/abcd.txt'
        }
      ]
    })
    setTimeout(() => {
      const output = execSync('docker exec abcd ls /app/public/abcd.txt')
      console.log(output.toString())
      expect(output).not.toContain('No such file')
    }, 1000)
  })

  test('# stop', async () => {
    let result = await stopSync(pid)
    expect(result.thread).toEqual(0)
    result = await status(pid)
    for (let i = 0; i < 30 || result.status.stat === 'loading'; ++i) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      result = await status(pid)
    }
    expect(result.status.stat).toEqual('stopped')
  })

  test('# runAll', async () => {
    await db.saveOne(Project, pid, { thread: -1 })
    await runAll()
    let result = await status(pid)
    for (let i = 0; i < 30 || result.status.stat === 'loading'; ++i) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      result = await status(pid)
    }
    expect(result.status.stat).toEqual('running')
  })

  test('# del', async () => {
    await del(pid)
    expect(await db.select(Project, { _index: pid })).toBeNull()
  })
})
