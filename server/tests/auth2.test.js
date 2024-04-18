import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
process.env.NODE_ENV = 'dev'
import { db2StrPolicy } from '../services/auth.js'
import { db } from '../utils/index.js'

describe('# 权限系统，用Casbin重写', () => {
  describe('# 可行性测试', () => {
    test('# 现有授权策略转Casbin格式', async () => {
      const project = await db.select(Project, { name: 'login_platform' })
      await db2StrPolicy(project._id)
    })
  })
})
