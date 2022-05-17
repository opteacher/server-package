import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Path from 'path'
import { beforeAll, beforeEach, afterAll, expect, test } from '@jest/globals'
import { db } from '../utils/index.js'
import Project from '../models/project'
import Model from '../models/model'
import Service from '../models/service'
import Node from '../models/node'
import Dep from '../models/dep'
import { create } from '../services/model'
import { bind, unbind, genSign } from '../services/auth'

describe('# 权限服务', () => {
  let pid = ''
  let mid = ''
  let sid = ''
  beforeAll(async () => {
    await db.sync(Project)
    await db.sync(Model)
    await db.sync(Service)
    await db.sync(Node)
    await db.sync(Dep)
    await db.dump(Dep, Path.resolve('resources/database/dependency.json'))
    const project = await db.save(Project, {
      name: 'abcd',
      desc: '12345',
      port: 2000,
      database: ['mongo', 'test'],
      dropDbs: true,
      commands: 'echo "Hello World"',
      auth: {
        model: '',
        skips: [],
        roles: [],
        apis: []
      }
    })
    pid = project.id.toString()

    const model = await create({
      name: 'model1',
      desc: 'Hello Model',
      logTime: true,
      props: [
        {
          name: 'username',
          label: '用户名',
          ptype: 'String',
          index: true,
          unique: true,
          visible: true,
          remark: '记录标识'
        },
        {
          name: 'password',
          label: '密码',
          ptype: 'String',
          index: true,
          unique: true,
          visible: true,
          remark: '验证标识'
        }
      ]
    })
    mid = model.id.toString()
    await db.saveOne(Project, pid, { models: mid }, { updMode: 'append' })

    const svcForSkip = await db.save(Service, {
      name: 'model1',
      interface: 'test',
      emit: 'api',
      isModel: true,
      method: 'POST',
      path: '/api/v1/model1/test'
    })
    sid = svcForSkip.id.toString()
    await db.saveOne(Model, model.id, { svcs: sid }, { updMode: 'append' })
  })
  test('# bind', async () => {
    await bind(pid, { model: mid, skips: ['/api/v1/model1/test'] })
    const project = await db.select(Project, { _index: pid })
    expect(project.auth.model).toEqual(mid)
    expect(project.auth.skips.length).toEqual(3)
    const skips = project.auth.skips.map(skip => skip.substring('/api/v1/model1/'.length))
    expect(skips).toContain('sign')
    expect(skips).toContain('verify')
    expect(skips).toContain('test')

    const model = await db.select(Model, { _index: mid }, { ext: true })
    expect(model.props.map(prop => prop.name)).toContain('role')
    expect(model.svcs.length).toEqual(3)
    const svcItfcs = model.svcs.map(svc => svc.interface)
    expect(svcItfcs).toContain('sign')
    expect(svcItfcs).toContain('verify')
    expect(svcItfcs).toContain('test')
  })
  describe('# unbind', () => {
    test('# 解绑有绑定权限', async () => {
      await unbind(pid)
      const project = await db.select(Project, { _index: pid })
      expect(project.auth.model).toEqual('')
      expect(project.auth.skips.length).toEqual(0)

      const model = await db.select(Model, { _index: mid }, { ext: true })
      expect(model.props.map(prop => prop.name)).not.toContain('role')
      expect(model.svcs.length).toEqual(1)
      const svcItfcs = model.svcs.map(svc => svc.interface)
      expect(svcItfcs).not.toContain('sign')
      expect(svcItfcs).not.toContain('verify')
      expect(svcItfcs).toContain('test')
    })

    test('# 解绑已绑定权限', async () => {
      const result = await unbind(pid)
      expect(result).toHaveProperty('error', '项目未绑定模型')
    })
  })
  describe('# genSign', () => {
    beforeAll(async () => {
      await bind(pid, { model: mid, skips: ['/test'] })
    })
    test('# 为不带签名服务的权限模型生成签名逻辑', async () => {
      await genSign(pid, [
        { name: 'username', alg: 'none' },
        { name: 'password', alg: 'sha256' }
      ])
      const project = await db.select(Project, { _index: pid })
      const model = await db.select(Model, { _index: project.auth.model }, { ext: true })
      const sgnIdx = model.svcs.findIndex(svc => svc.name === 'auth' && svc.interface === 'sign')
      expect(sgnIdx).not.toEqual(-1)
      const sgnSvc = model.svcs[sgnIdx]
      expect(sgnSvc.flow).not.toBeNull()
      const getSecret = await db.select(Node, { _index: sgnSvc.flow })
      expect(getSecret.title).toEqual('获取密钥')
      expect(getSecret.nexts.length).toEqual(1)
      const qryRecord = await db.select(Node, { _index: getSecret.nexts[0] })
      expect(qryRecord.title).toEqual('查询满足列的记录')
      expect(qryRecord.nexts.length).toEqual(1)
      const pkgAndSgn = await db.select(Node, { _index: qryRecord.nexts[0] })
      expect(pkgAndSgn.title).toEqual('包装荷载并签名')
      expect(pkgAndSgn.nexts.length).toEqual(0)
    })
  })
})
