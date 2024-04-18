import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'

describe('# 权限系统，用Casbin重写', () => {
  describe('# 可行性测试', () => {
    test('# 现有授权策略转Casbin格式', async () => {
      process.env.NODE_ENV = 'dev'
      const { db } = await import('../utils/index.js')
      const Project = await import('../models/project.js').then(exp => exp.default)
      const result = await db.select(Project, { name: 'login_platform' })
      expect(result.length).not.toBe(0)
      const { db2StrPolicy } = await import('../services/auth.js')
      await db2StrPolicy(result[0]._id)
    })
  })
})
