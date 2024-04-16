import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { newEnforcer } from 'casbin'
import { MongoClient } from 'mongodb'
import { MongooseAdapter } from 'casbin-mongoose-adapter'
import csv from 'fast-csv'
import mongoose from 'mongoose'

const bscMdlConf = './tests/casbin/basic_model.conf'
const bscPlcyCsv = './tests/casbin/basic_policy.csv'
const kmMdlConf = './tests/casbin/keymatch_model.conf'
const kmPlcyCsv = './tests/casbin/keymatch_policy.csv'

const PolicyModel = mongoose.model(
  'policy',
  mongoose.Schema({
    ptype: { type: String, required: true },
    v0: { type: String, required: true },
    v1: { type: String, required: true },
    v2: { type: String, required: true },
    v3: { type: String, required: true },
    v4: { type: String, required: true },
    v5: { type: String, required: true }
  })
)

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

    test('# 通过，前缀匹配（单层子路径），指定method', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('cathy', '/cathy_data/s', 'PUT')
      expect(res).toBeTruthy()
    })

    test('# 不通过，前缀匹配（多层子路径），指定method', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('cathy', '/cathy_data/s/a', 'PUT')
      expect(res).toBeFalsy()
    })

    test('# 通过，全路径匹配，多method，GET', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('cathy', '/cathy_data', 'GET')
      expect(res).toBeTruthy()
    })

    test('# 通过，全路径匹配，多method，POST', async () => {
      const enforcer = await newEnforcer(kmMdlConf, kmPlcyCsv)
      const res = await enforcer.enforce('cathy', '/cathy_data', 'POST')
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
    beforeEach(async () => {
      try {
        const connection = await MongoClient.connect(globalThis.__MONGO_URI__)
        await connection.db(globalThis.__MONGO_DB_NAME__).dropCollection(collection)
        const policies = []
        csv
          .parseFile(kmPlcyCsv, { headers: false, ignoreEmpty: true })
          .on('data', data => {
            data['_id'] = new mongoose.Types.ObjectId()
            policies.push(data)
          })
          .on('end', () => {
            PolicyModel.create(policies, err => {
              if (err) {
                throw err
              }
            })
          })
      } catch (e) {}
    })

    test('# 通过', async () => {
      const adapter = await MongooseAdapter.newAdapter(
        globalThis.__MONGO_URI__ + globalThis.__MONGO_DB_NAME__
      )
      const enforcer = await newEnforcer(kmMdlConf, adapter)
      const res = await enforcer.enforce('alice', '/alice_data/resource1', 'POST')
      expect(res).toBeTruthy()
    }, 60000)
  })
})
