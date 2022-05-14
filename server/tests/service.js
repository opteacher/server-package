import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { db } from '../utils/index.js'
import Database from '../models/database.js'
import Project from '../models/project.js'
import Service from '../models/service.js'
import Model from '../models/model.js'
import Node from '../models/node.js'
import { restart, stop } from '../services/service.js'
import { sync, del, status } from '../services/project.js'

jest.setTimeout(300000)

describe('# 任务服务', () => {
  let pid = ''
  let intervalSid = ''
  let timeoutSid = ''
  beforeAll(async () => {
    await db.sync(Database)
    await db.sync(Project)
    await db.sync(Service)
    await db.sync(Model)
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
    pid = project.id

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
      ]
    })
    await db.saveOne(Project, pid, { models: model.id }, { updMode: 'append' })

    let service = await db.save(Service, {
      name: 'svc1',
      model: 'model1',
      interface: 'testSvc1',
      emit: 'interval',
      isModel: false,
      path: '/abcd/job/v1/model1/interval',
      jobId: 0,
      condition: '3s'
    })
    intervalSid = service.id
    await db.saveOne(Model, model.id, { svcs: intervalSid }, { updMode: 'append' })

    service = await db.save(Service, {
      name: 'svc2',
      model: 'model1',
      interface: 'testSvc2',
      emit: 'interval',
      isModel: false,
      path: '/abcd/job/v1/model1/timeout',
      jobId: 0,
      condition: '22/05/09T23:05:00'
    })
    timeoutSid = service.id
    await db.saveOne(Model, model.id, { svcs: timeoutSid }, { updMode: 'append' })

    const node = await db.save(Node, {
      isTemp: false,
      title: '测试输出',
      desc: '测试测试测试',
      ntype: 'normal',
      inputs: [
        {
          name: 'input1',
          vtype: 'Object',
          value: 'ctx',
          prop: 'request.query.text',
          remark: '输出\'测试测试测试\''
        }
      ],
      isFun: false,
      code: 'console.log(\'测试测试测试，\' + input1)'
    })
    await db.saveOne(Service, intervalSid, { flow: node.id })
    await db.saveOne(Service, timeoutSid, { flow: node.id })

    await sync(pid)
    let result = await status(pid)
    for (let i = 0; i < 30 || result.status === 'loading'; ++i) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      result = await status(pid)
    }
  })

  describe('# 开启', () => {
    let jid = 0

    test('# 开始定时任务', async () => {
      console.log(await restart(pid, intervalSid))
      const service = await db.select(Service, { _index: intervalSid })
      expect(service.jobId).not.toEqual(0)
      jid = service.jobId
    })

    test('# 运行中重启', async () => {
      console.log(await restart(pid, intervalSid))
      const service = await db.select(Service, { _index: intervalSid })
      expect(service.jobId).not.toEqual(0)
      expect(service.jobId).not.toEqual(jid)
    })

    test('# 开始延时任务', async () => {
      console.log(await restart(pid, timeoutSid))
      const service = await db.select(Service, { _index: timeoutSid })
      expect(service.jobId).not.toEqual(0)
    })
  })

  test('# 停止', async () => {
    console.log(await stop(pid, intervalSid))
    console.log(await stop(pid, timeoutSid))
    let service = await db.select(Service, { _index: intervalSid })
    expect(service.jobId).toEqual(0)
    service = await db.select(Service, { _index: timeoutSid })
    expect(service.jobId).toEqual(0)
  })

  afterAll(async () => {
    await del(pid)
  })
})
