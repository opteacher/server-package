import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Path from 'path'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { db } from '../utils/index.js'
import Project from '../models/project'
import Model from '../models/model'
import Service from '../models/service'
import Node from '../models/node'
import Dep from '../models/dep'
import Admin from '../models/admin'
import { generate as genApp } from '../services/project'
import { create } from '../services/model'
import { bind, unbind, genSign } from '../services/auth'
import getApp from '../appTest'
import supertest from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import { readConfig } from '../lib/backend-library/utils/index'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

jest.setTimeout(300000)

describe('# 权限服务', () => {
  let pid = ''
  let mid = ''
  let sid = ''
  let svrCfg = null
  beforeAll(async () => {
    svrCfg = await readConfig(Path.resolve('configs', 'server'))

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

    let svcTest = await db.save(Service, {
      name: 'model1',
      emit: 'api',
      model: 'model1',
      method: 'POST',
      path: '/mdl/v1/model1'
    })
    sid = svcTest.id.toString()
    await db.saveOne(Project, pid, { services: sid }, { updMode: 'append' })

    svcTest = await db.save(Service, {
      name: 'model1',
      emit: 'api',
      model: 'model1',
      method: 'GET',
      path: '/mdl/v1/model1/:id'
    })
    await db.saveOne(Project, pid, { services: svcTest.id }, { updMode: 'append' })
  })
  test('# bind', async () => {
    await bind(pid, { model: mid, skips: ['/mdl/v1/model1/test'] })
    const project = await db.select(Project, { _index: pid }, { ext: true })
    expect(project.auth.model).toEqual(mid)
    expect(project.auth.skips.length).toEqual(3)
    const skips = project.auth.skips.map(skip => skip.substring('/api/v1/model1/'.length))
    expect(skips).toContain('sign')
    expect(skips).toContain('verify')
    expect(skips).toContain('test')

    const model = await db.select(Model, { _index: mid })
    expect(model.props.map(prop => prop.name)).toContain('role')
    expect(project.services.length).toEqual(4)
    const svcItfcs = project.services.map(svc => svc.interface)
    expect(svcItfcs).toContain('sign')
    expect(svcItfcs).toContain('verify')
  })
  describe('# unbind', () => {
    test('# 解绑有绑定权限', async () => {
      await unbind(pid)
      const project = await db.select(Project, { _index: pid }, { ext: true })
      expect(project.auth.model).toEqual('')
      expect(project.auth.skips.length).toEqual(0)

      const model = await db.select(Model, { _index: mid })
      expect(model.props.map(prop => prop.name)).not.toContain('role')
      expect(project.services.length).toEqual(2)
      const svcItfcs = project.services.map(svc => svc.interface)
      expect(svcItfcs).not.toContain('sign')
      expect(svcItfcs).not.toContain('verify')
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
        { key: uuidv4(), name: 'username', alg: 'none' },
        { key: uuidv4(), name: 'password', alg: 'sha256' }
      ])
      const project = await db.select(Project, { _index: pid }, { ext: true })
      const sgnIdx = project.services.findIndex(svc => svc.name === 'auth' && svc.interface === 'sign')
      expect(sgnIdx).not.toEqual(-1)
      const sgnSvc = project.services[sgnIdx]
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
  describe('# auth', () => {
    let request = null
    let authSvc = null
    let model1 = null
    let token = ''
    let aid = ''
    beforeAll(async () => {
      request = supertest((await getApp()).callback())
      process.env.BASE_URL = ''
      process.env.NODE_ENV = 'test'
      await genApp(pid)
      fs.rmSync(Path.resolve('tmp'), { force: true, recursive: true })
      const authPath = Path.resolve('tmp', 'services')
      fs.mkdirSync(authPath, { recursive: true })
      const mdlPath = Path.resolve('tmp', 'models')
      fs.mkdirSync(mdlPath, { recursive: true })

      const project = await db.select(Project, { _index: pid }, { ext: true })
      const pjtPath = Path.resolve(svrCfg.apps, project.name)
      const authFile = Path.join(authPath, 'auth.js')
      fs.copyFileSync(Path.join(pjtPath, 'services', 'auth.js'), authFile)
      fs.writeFileSync(
        authFile,
        fs.readFileSync(authFile).toString().replace('../utils', '../../utils')
      )
      const mdlFile = Path.join(mdlPath, `${project.models[0].name}.js`)
      fs.copyFileSync(Path.join(pjtPath, 'models', `${project.models[0].name}.js`), mdlFile)
      fs.writeFileSync(
        mdlFile,
        fs.readFileSync(mdlFile).toString().replace('../utils', '../../utils')
      )

      authSvc = await import(authFile)
      model1 = (await import(mdlFile)).default
      await db.sync(model1)
      const result = await db.save(model1, {
        username: 'abcd',
        password: crypto.createHmac('sha256', svrCfg.secret).update('1234').digest('hex')
      })
      aid = result.id.toString()
    })

    test('# sign，再签名应该通过且产生正确的token', async () => {
      const result = await authSvc.sign({
        request: {
          body: {
            username: 'abcd',
            password: '1234'
          }
        }
      })
      expect(result).not.toHaveProperty('error')
      expect(result).toHaveProperty('token')
      expect(result.token).not.toEqual('abcd')
      token = result.token
    })

    describe('# chk404', () => {
      test('# 错误的路由路径', async () => {
        expect(await authSvc.chk404({ path: '/test', method: 'GET' })).toEqual(false)
      })

      test('# 错误的路由方式', async () => {
        expect(await authSvc.chk404({ path: '/mdl/v1/model1/123', method: 'POST' })).toEqual(false)
      })

      test('# 正确', async () => {
        expect(await authSvc.chk404({ path: '/mdl/v1/model1', method: 'POST' })).toEqual(true)
      })
    })

    describe('# verify', () => {
      test('# 无效token（空）', async () => {
        const result = await authSvc.verify({
          headers: {}
        })
        expect(result).toHaveProperty('error', '无鉴权口令')
      })

      test('# 无效token（错误1）', async () => {
        const result = await authSvc.verify({
          headers: { authorization: 'abcd' + token }
        })
        expect(result).toHaveProperty('error', '错误的鉴权请求！')
      })

      test('# 无效token（错误2）', async () => {
        const result = await authSvc.verify({
          headers: { authorization: 'cctv abcd' }
        })
        expect(result).toHaveProperty('error', '鉴权失败！未知鉴权方式：cctv')
      })

      test('# 无效token（错误3）', async () => {
        const result = await authSvc.verify({
          headers: { authorization: 'bearer abcd' }
        })
        expect(result).toHaveProperty('error')
        expect(result.error.startsWith('鉴权失败！')).toBeTruthy()
        console.log(result.error)
      })

      test('# 正确token', async () => {
        const result = await authSvc.verify({
          headers: { authorization: 'bearer ' + token }
        })
        expect(result).not.toHaveProperty('error')
        expect(result).toHaveProperty('message', '验证通过！')
        expect(result).toHaveProperty('payload')
        expect(result.payload).toHaveProperty('sub', aid)
        console.log(result.payload)
      })
    })

    describe('# verifyDeep', () => {
      beforeAll(async () => {
        await db.save(Project, {
          name: 'dcba',
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
      })

      describe('# 角色信息有误', () => {
        test('# verify出错', async () => {
          const result = await authSvc.verifyDeep({
            path: '/abcd/mdl/v1/model1',
            headers: { authorization: '' }
          })
          expect(result).toHaveProperty('error')
        })

        describe('# token可用，但关联的是管理员', () => {
          let admToken = ''
          beforeAll(async () => {
            await db.sync(Admin)
            const admin = await db.save(Admin, {
              name: 'admin',
              phone: '13918559376',
              password: '12345'
            })
            admToken = jwt.sign(
              {
                sub: admin.id,
                aud: 'abcd',
                iat: Date.now(),
                jti: uuidv4(),
                iss: 'server-package/op',
                exp: Date.now() + 24 * 60 * 60 * 1000 // 1 day
              },
              svrCfg.secret
            )
          })
          test('# 管理员token', async () => {
            const result = await authSvc.verifyDeep({
              path: '/abcd/mdl/v1/model1',
              headers: { authorization: 'bearer ' + admToken }
            })
            expect(result).not.toHaveProperty('error')
          })
        })

        test('# 未分配角色的账户', async () => {
          const result = await authSvc.verifyDeep({
            path: '/abcd/mdl/v1/model1',
            headers: { authorization: 'bearer ' + token }
          })
          expect(result).toHaveProperty('error', '未找到指定角色！')
        })

        describe('# 分配未记录过的角色信息', () => {
          beforeAll(async () => {
            await db.saveOne(model1, aid, { role: 'admin' })
          })
          test('# token正常，但解析出的角色没有记录', async () => {
            const result = await authSvc.verifyDeep({
              path: '/abcd/mdl/v1/model1',
              headers: { authorization: 'bearer ' + token }
            })
            expect(result).toHaveProperty('error', '未找到指定角色！')
          })
        })

        describe('# 添加一条admin角色记录并分配权限', () => {
          beforeAll(async () => {
            await db.saveOne(
              Project,
              pid,
              { 'auth.roles': { name: 'admin', rules: [] } },
              { updMode: 'append' }
            )
          })
          test('# token正常，也有相应角色记录，但角色没有指定权限', async () => {
            const result = await authSvc.verifyDeep({
              path: '/abcd/mdl/v1/model1',
              headers: { authorization: 'bearer ' + token }
            })
            expect(result).toHaveProperty('error', '你不具备访问该资源的权限！')
          })
        })
      })

      describe('# 为admin角色分配权限（全路径匹配）', () => {
        beforeAll(async () => {
          await db.saveOne(
            Project,
            pid,
            {
              'auth.roles[{name:admin}].rules': {
                method: 'GET',
                path: '/abcd/mdl/v1/model1',
                value: ''
              }
            },
            { updMode: 'append' }
          )
        })
        test('# 通过', async () => {
          const result = await authSvc.verifyDeep({
            path: '/abcd/mdl/v1/model1',
            method: 'GET',
            headers: { authorization: 'bearer ' + token }
          })
          expect(result).not.toHaveProperty('error')
        })
        afterAll(async () => {
          await db.saveOne(Project, pid, {
            'auth.roles[{name:admin}].rules': []
          })
        })
      })

      describe('# 为admin角色分配权限（一层子路径匹配）', () => {
        beforeAll(async () => {
          await db.saveOne(
            Project,
            pid,
            {
              'auth.roles[{name:admin}].rules': {
                method: 'GET',
                path: '/abcd/mdl/v1',
                value: '*'
              }
            },
            { updMode: 'append' }
          )
        })
        test('# 通过', async () => {
          const result = await authSvc.verifyDeep({
            path: '/abcd/mdl/v1/model1',
            method: 'GET',
            headers: { authorization: 'bearer ' + token }
          })
          expect(result).not.toHaveProperty('error')
        })
        afterAll(async () => {
          await db.saveOne(Project, pid, {
            'auth.roles[{name:admin}].rules': []
          })
        })
      })

      describe('# 为admin角色分配权限（多层子路径匹配）', () => {
        beforeAll(async () => {
          await db.saveOne(
            Project,
            pid,
            {
              'auth.roles[{name:admin}].rules': {
                method: 'GET',
                path: '/abcd',
                value: '*/*'
              }
            },
            { updMode: 'append' }
          )
        })
        test('# 通过', async () => {
          const result = await authSvc.verifyDeep({
            path: '/abcd/mdl/v1/model1',
            method: 'GET',
            headers: { authorization: 'bearer ' + token }
          })
          expect(result).not.toHaveProperty('error')
        })
        afterAll(async () => {
          await db.saveOne(Project, pid, {
            'auth.roles[{name:admin}].rules': []
          })
        })
      })

      describe('# 为admin角色分配权限（错误的method）', () => {
        beforeAll(async () => {
          await db.saveOne(
            Project,
            pid,
            {
              'auth.roles[{name:admin}].rules': {
                method: 'POST',
                path: '/abcd',
                value: '*/*'
              }
            },
            { updMode: 'append' }
          )
        })
        test('# 无权限', async () => {
          const result = await authSvc.verifyDeep({
            path: '/abcd/mdl/v1/model1',
            method: 'GET',
            headers: { authorization: 'bearer ' + token }
          })
          expect(result).toHaveProperty('error', '你不具备访问该资源的权限！')
        })
        afterAll(async () => {
          await db.saveOne(Project, pid, {
            'auth.roles[{name:admin}].rules': []
          })
        })
      })
    })
  })
})
