import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { StringAdapter, newEnforcer } from 'casbin'
import { MongooseAdapter } from 'casbin-mongoose-adapter'
import csv from 'fast-csv'
import mongoose from 'mongoose'
mongoose.Promise = global.Promise
import fs from 'fs'

const bscMdlConf = './tests/casbin/basic_model.conf'
const bscPlcyCsv = './tests/casbin/basic_policy.csv'
const kmMdlConf = './tests/casbin/keymatch_model.conf'
const kmPlcyCsv = './tests/casbin/keymatch_policy.csv'

const PolicyModel = mongoose.model(
  'policy',
  mongoose.Schema({
    ptype: { type: String, required: true },
    v0: { type: String },
    v1: { type: String },
    v2: { type: String },
    v3: { type: String },
    v4: { type: String },
    v5: { type: String }
  }),
  'casbin_rule'
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

  describe('# 字符串配置的策略，模型RESTFUL', () => {
    let strPolicy = ''
    beforeAll(async () => {
      const buffer = fs.readFileSync(kmPlcyCsv)
      strPolicy = buffer.toString()
    })

    test('# 通过', async () => {
      const adapter = new StringAdapter(strPolicy)
      const enforcer = await newEnforcer(kmMdlConf, adapter)
      const res = await enforcer.enforce('alice', '/alice_data/resource1', 'POST')
      expect(res).toBeTruthy()
    })

    test('# 不通过', async () => {
      const adapter = new StringAdapter(strPolicy)
      const enforcer = await newEnforcer(kmMdlConf, adapter)
      const res = await enforcer.enforce('alice', '/bob_data/resource1', 'POST')
      expect(res).toBeFalsy()
    })
  })

  describe('# 数据库（mongodb）配置和策略，模型RESTFUL', () => {
    beforeEach(async () => {
      try {
        mongoose.connect(globalThis.__MONGO_URI__ + globalThis.__MONGO_DB_NAME__, {
          useNewUrlParser: true,
          keepAlive: false
        })
        await PolicyModel.deleteMany()
        const policies = []
        await new Promise((resolve, reject) =>
          csv
            .parseFile(kmPlcyCsv, { headers: false, ignoreEmpty: true })
            .on('data', data =>
              policies.push({
                _id: new mongoose.Types.ObjectId(),
                ptype: data[0],
                v0: data[1],
                v1: data[2],
                v2: data[3]
              })
            )
            .on('error', reject)
            .on('end', () => PolicyModel.create(policies).then(resolve).catch(reject))
        )
      } catch (e) {}
    })

    test('# 添加策略', async () => {
      const adapter = await MongooseAdapter.newAdapter(
        globalThis.__MONGO_URI__ + globalThis.__MONGO_DB_NAME__
      )
      const enforcer = await newEnforcer(kmMdlConf, adapter)
      await enforcer.addPolicy('p', 'op', '/asd/dsfsd', 'POST')
      expect(await enforcer.hasPolicy('p', 'op', '/asd/dsfsd', 'POST'))
    })

    test('# 罗列策略', async () => {
      const adapter = await MongooseAdapter.newAdapter(
        globalThis.__MONGO_URI__ + globalThis.__MONGO_DB_NAME__
      )
      const enforcer = await newEnforcer(kmMdlConf, adapter)
      const policies = await enforcer.getPolicy()
      expect(policies.length).not.toBe(0)
      expect(policies[0]).toStrictEqual(['alice', '/alice_data/*', 'GET'])
    })

    test('# 通过', async () => {
      const adapter = await MongooseAdapter.newAdapter(
        globalThis.__MONGO_URI__ + globalThis.__MONGO_DB_NAME__
      )
      const enforcer = await newEnforcer(kmMdlConf, adapter)
      const res = await enforcer.enforce('alice', '/alice_data/resource1', 'POST')
      expect(res).toBeTruthy()
    })

    test('# 不通过', async () => {
      const adapter = await MongooseAdapter.newAdapter(
        globalThis.__MONGO_URI__ + globalThis.__MONGO_DB_NAME__
      )
      const enforcer = await newEnforcer(kmMdlConf, adapter)
      const res = await enforcer.enforce('cathy', '/cathy_data/s/a', 'PUT')
      expect(res).toBeFalsy()
    })
  })
})
