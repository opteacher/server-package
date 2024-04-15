import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { newEnforcer } from 'casbin'

const bscMdlConf = './tests/casbin/basic_model.conf'
const bscPlcyCsv = './tests/casbin/basic_policy.csv'
const kmMdlConf = './tests/casbin/keymatch_model.conf'
const kmPlcyCsv = './tests/casbin/keymatch_policy.csv'

describe('# Casbin', () => {
  describe('# 文件配置和策略，模型ACL', () => {
    test('# 通过', async () => {
      const enforcer = await newEnforcer(bscMdlConf, bscPlcyCsv)
      const res = await enforcer.enforce('alice', 'data1', 'read')
      expect(res).toBeTruthy()
    })

    test('# 不通过，受限数据', async () => {
      const enforcer = await newEnforcer(bscMdlConf, bscPlcyCsv)
      const res = await enforcer.enforce('alice', 'data2', 'read')
      expect(res).toBeFalsy()
    })

    test('# 不通过，受限操作', async () => {
      const enforcer = await newEnforcer(bscMdlConf, bscPlcyCsv)
      const res = await enforcer.enforce('alice', 'data1', 'write')
      expect(res).toBeFalsy()
    })

    test('# 不通过，未知用户', async () => {
      const enforcer = await newEnforcer(bscMdlConf, bscPlcyCsv)
      const res = await enforcer.enforce('alice1', 'data1', 'write')
      expect(res).toBeFalsy()
    })

    test('# 不通过，未知数据', async () => {
      const enforcer = await newEnforcer(bscMdlConf, bscPlcyCsv)
      const res = await enforcer.enforce('alice', 'data3', 'write')
      expect(res).toBeFalsy()
    })

    test('# 不通过，未知操作', async () => {
      const enforcer = await newEnforcer(bscMdlConf, bscPlcyCsv)
      const res = await enforcer.enforce('alice', 'data1', 'delete')
      expect(res).toBeFalsy()
    })
  })

  describe('# 文件配置和策略，模型RESTful', () => {
    test('# 通过，全路径匹配，指定method', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('alice', '/alice_data/resource1', 'POST')
      expect(res).toBeTruthy()
    })

    test('# 通过，前缀匹配，指定method', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('bob', '/bob_data/abcd', 'POST')
      expect(res).toBeTruthy()
    })

    test('# 通过，前缀匹配（多子路径），指定method', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('bob', '/bob_data/abcd/1234', 'POST')
      expect(res).toBeTruthy()
    })

    test('# 通过，前缀匹配（多子路径），指定method', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('cathy', '/cathy_data/abcd', 'PUT')
      expect(res).toBeTruthy()
    })

    test('# 通过，全路径匹配，多method', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('cathy', '/cathy_data', 'GET')
      expect(res).toBeTruthy()
    })

    test('# 不通过，错误用户', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('bob', '/alice_data/resource1', 'POST')
      expect(res).toBeFalsy()
    })

    test('# 不通过，错误数据', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('alice', '/cathy_data', 'POST')
      expect(res).toBeFalsy()
    })

    test('# 不通过，错误操作', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('alice', '/alice_data/resource1', 'PUT')
      expect(res).toBeFalsy()
    })
  })

  describe('# 数据库（mongodb）配置和策略，模型ACL', () => {
  })
})
