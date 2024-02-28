import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, describe } from '@jest/globals'
import { db } from '../utils/index.js'
import Admin from '../models/admin.js'
import { regup, login, verify } from '../services/admin.js'

describe('# 管理员服务', () => {
  let token = ''
  let admId = ''
  beforeAll(async () => {
    await db.sync(Admin)
  })
  describe('# regup', () => {
    test('# 正常注册', async () => {
      const result = await regup({
        name: 'abcd',
        password: '12345',
        code: 'opteacher'
      })
      expect(result).not.toHaveProperty('error')
      expect(result).not.toHaveProperty('password')
      expect(result).toHaveProperty('_id')
      expect(result._id).not.toEqual('')
      admId = result._id.toString()
    })

    test('# 重复注册', async () => {
      const result = await regup({
        name: 'abcd',
        password: '12345',
        code: 'opteacher'
      })
      expect(result).toHaveProperty('error', '用户名已经被注册！')
    })

    test('# 错误的注册代码', async () => {
      const result = await regup({
        name: 'dcba',
        password: '12345',
        code: 'opower'
      })
      expect(result).toHaveProperty('error', '验证码错误！')
    })
  })
  describe('# login', () => {
    test('# 正常登录', async () => {
      const result = await login({ name: 'abcd', password: '12345' })
      expect(result).not.toHaveProperty('error')
      expect(result).toHaveProperty('token')
      expect(result.token).not.toEqual('')
      token = result.token
      expect(result).toHaveProperty('admin')
      expect(result.admin.name).toEqual('abcd')
    })

    test('# 管理员未注册', async () => {
      const result = await login({ name: 'dcba', password: '12345' })
      expect(result).toHaveProperty('error', '用户名不存在')
    })

    test('# 错误的密码', async () => {
      const result = await login({ name: 'abcd', password: '123456' })
      expect(result).toHaveProperty('error', '错误的登录密码')
    })
  })
  describe('# verify', () => {
    test('# 正常token', () => {
      expect(() => {
        const result = verify({ headers: { authorization: `Bearer ${token}` } })
        expect(result).not.toHaveProperty('error')
        expect(result).toHaveProperty('payload')
        expect(result.payload.sub).toEqual(admId)
      }).not.toThrow()
    })

    test('# 错误token（token为空）', () => {
      const result = verify({ headers: { authorization: '' } })
      expect(result).toHaveProperty('error', '无鉴权口令')
    })

    test('# 错误token（Bearer错误）', () => {
      const result = verify({ headers: { authorization: 'Bearer' } })
      expect(result).toHaveProperty('error', '错误的鉴权请求！')
    })

    test('# 错误token（错误的方式）', () => {
      const result = verify({ headers: { authorization: `Abcd ${token}` } })
      expect(result).toHaveProperty('error')
    })

    test('# 错误token（错误的token）', () => {
      const result = verify({ headers: { authorization: `Bearer ${token}abcd` } })
      expect(result).toHaveProperty('error')
    })
  })
})
