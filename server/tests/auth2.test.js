import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { createMockContext } from '@shopify/jest-koa-mocks'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
mongoose.Promise = global.Promise
import { v4 as uuidv4 } from 'uuid'

describe('# 权限系统，用Casbin重写', () => {
  process.env.NODE_ENV = 'dev'
  beforeAll(async () => {
    console.log('创建一个测试项目包含权限系统……')
    const { db } = await import('../utils/index.js')
    const Project = await import('../models/project.js').then(exp => exp.default)
    const Model = await import('../models/model.js').then(exp => exp.default)
    await db.remove(Project, { name: 'test_auth2' })
    await db.remove(Model, { name: 'test_anth2_model' })
  })

  describe('# 可行性测试', () => {
    test('# 现有授权策略转Casbin格式', async () => {
      const { db } = await import('../utils/index.js')
      const Project = await import('../models/project.js').then(exp => exp.default)
      const result = await db.select(Project, { name: 'login_platform' })
      expect(result.length).not.toBe(0)
      const { db2StrPolicy } = await import('../services/auth.js')
      expect(await db2StrPolicy(result[0])).toHaveLength(4)
    })

    describe('# 请求校验', () => {
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
        const { getSecret } = await import('../services/auth.js')
        const authorization =
          'Bearer ' +
          jwt.sign(
            {
              sub: admin._id,
              aud: 'server-package',
              iat: Date.now(),
              jti: uuidv4(),
              iss: `server-package/${admin.name}`,
              exp: Date.now() + 24 * 60 * 60 * 1000 // 1 day
            },
            await getSecret()
          )
        global.jest = jest
        ctx = createMockContext({ headers: { authorization } })
      })

      test('# 创建koa请求附带签名，普通校验', async () => {
        const { verify } = await import('../services/auth.js')
        const resp = await verify(ctx)
        expect(resp.error).toBeUndefined()
        expect(resp.payload).toHaveProperty('sub', admin._id.toString())
      })

      test('# 创建koa请求附带签名，深层校验（Casbin校验）', async () => {
        const { verifyDeep } = await import('../services/auth.js')
        const resp = await verifyDeep(ctx)
        console.log(resp)
        expect(resp.error).toBeUndefined()
      })
    })
  })
})
