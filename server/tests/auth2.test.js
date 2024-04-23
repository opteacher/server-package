import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { createMockContext } from '@shopify/jest-koa-mocks'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
mongoose.Promise = global.Promise
import { v4 as uuidv4 } from 'uuid'
import project from './models/project.json'
import models from './models/model.json'
import { copyFileSync, rmSync } from 'fs'

const pjtName = 'test_auth2'
const mdlName = 'test_anth2_model'
const model = models[mdlName]
const url = `http://127.0.0.1:4000/${pjtName}/mdl/v1/${mdlName}`
const genPayload = admin => ({
  sub: admin._id,
  aud: 'server-package',
  iat: Date.now(),
  jti: uuidv4(),
  iss: `server-package/${admin.name}`,
  exp: Date.now() + 24 * 60 * 60 * 1000 // 1 day
})

describe('# 权限系统，用Casbin重写', () => {
  process.env.NODE_ENV = 'dev'
  beforeAll(async () => {
    console.log('创建一个测试项目包含权限系统……')
    const { db } = await import('../utils/index.js')
    const Project = await import('../models/project.js').then(exp => exp.default)
    const Model = await import('../models/model.js').then(exp => exp.default)
    await db.connect()
    await db.remove(Project, { name: pjtName })
    await db.save(Project, project)
    await db.remove(Model, { name: mdlName })
    await db.save(Model, model)
    const { adjustFile } = await import('../services/project.js')
    adjustFile('./resources/app-temp/models/temp.js', `./models/${model.name}.js`, {
      model: Object.assign(model, { services: [] })
    })
  })

  afterAll(async () => {
    console.log('扫清测试用数据……')
    const { db } = await import('../utils/index.js')
    const Project = await import('../models/project.js').then(exp => exp.default)
    const Model = await import('../models/model.js').then(exp => exp.default)
    await db.remove(Project, { name: pjtName })
    await db.remove(Model, { name: mdlName })
    await db.disconnect()
    rmSync(`./models/${model.name}.js`)
  })

  describe('# 项目和模型实例导入测试', () => {
    test('# 测试', async () => {
      const { loadInst } = await import('../services/auth2.js')
      const pjtIns = await loadInst('project', { name: pjtName })
      expect(pjtIns._id).toBeInstanceOf(mongoose.Types.ObjectId)
      expect(pjtIns._id.toString()).toBe(project._id)
    })

    describe('# 生产', () => {
      beforeAll(() => {
        copyFileSync('./tests/models/project.json', './models/project.json')
      })

      afterAll(() => {
        rmSync('./models/project.json', { force: true })
      })

      test('# 测试', async () => {
        const { loadInst } = await import('../services/auth2.js')
        const pjtIns = await loadInst('project')
        expect(typeof pjtIns._id).toBe('string')
      })
    })
  })

  test('# 现有授权策略转Casbin格式', async () => {
    const { db } = await import('../utils/index.js')
    const Project = await import('../models/project.js').then(exp => exp.default)
    const result = await db.select(Project, { name: pjtName })
    expect(result.length).not.toBe(0)
    const { db2StrPolicy } = await import('../services/auth2.js')
    expect(await db2StrPolicy(result[0])).toHaveLength(2)
  })

  describe('# 请求校验，创建koa请求附带签名', () => {
    describe('# 普通校验，超级管理员', () => {
      let admin = null
      let ctx = null

      beforeAll(async () => {
        const { db } = await import('../utils/index.js')
        const Admin = await import('../models/admin.js').then(exp => exp.default)
        await db.remove(Admin, { name: 'test' })
        admin = await db.save(Admin, {
          name: 'test',
          phone: '13918559376',
          password: '99a7deedf7db1952a32273974b7c96970daafba863d1467941c779f7731a94ee'
        })
        const { getSecret } = await import('../services/auth2.js')
        const authorization = 'Bearer ' + jwt.sign(genPayload(admin), await getSecret())
        global.jest = jest
        ctx = createMockContext({
          url,
          headers: { authorization }
        })
      })

      afterAll(async () => {
        const { db } = await import('../utils/index.js')
        const Admin = await import('../models/admin.js').then(exp => exp.default)
        await db.remove(Admin, { name: 'test' })
      })

      test('# 校验', async () => {
        const { verify } = await import('../services/auth2.js')
        const resp = await verify(ctx)
        expect(resp.error).toBeUndefined()
        expect(resp.payload).toHaveProperty('sub', admin._id.toString())
      })

      test('# 深层校验', async () => {
        const { verifyDeep } = await import('../services/auth2.js')
        const resp = await verifyDeep(ctx)
        expect(resp.error).not.toBeUndefined()
        expect(resp.error.startsWith('访问server-package失败！')).toBeTruthy()
      })
    })

    describe('# Casbin校验，普通账户', () => {
      let admin = null

      beforeAll(async () => {
        const { db } = await import('../utils/index.js')
        const Admin = await import(`../models/${model.name}.js`).then(exp => exp.default)
        await db.remove(Admin, { name: 'test' })
        admin = await db.save(Admin, {
          username: 'test',
          password: '99a7deedf7db1952a32273974b7c96970daafba863d1467941c779f7731a94ee',
          role: 'admin'
        })
      })

      afterAll(async () => {
        const { db } = await import('../utils/index.js')
        const Admin = await import('../models/admin.js').then(exp => exp.default)
        await db.remove(Admin, { username: 'test' })
      })

      test('# 校验', async () => {
        const { getSecret } = await import('../services/auth2.js')
        const authorization = 'Bearer ' + jwt.sign(genPayload(admin), await getSecret())
        global.jest = jest
        const ctx = createMockContext({
          url: url + '/s',
          method: 'GET',
          headers: { authorization }
        })
        const { verifyDeep } = await import('../services/auth2.js')
        const resp = await verifyDeep(ctx)
        expect(resp.error).toBeUndefined()
      })

      test('# 中间件', async () => {
        const { getSecret } = await import('../services/auth2.js')
        const authorization = 'Bearer ' + jwt.sign(genPayload(admin), await getSecret())
        global.jest = jest
        const ctx = createMockContext({
          url: url + '/s',
          method: 'GET',
          headers: { authorization }
        })
        const { auth } = await import('../services/auth2.js')
        const nxtFun = jest.fn()
        expect(async () => {
          await auth(ctx, nxtFun)
          expect(nxtFun).toBeCalled()
        }).not.toThrowError()
      })
    })
  })
})
