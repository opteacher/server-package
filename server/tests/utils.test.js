import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test } from '@jest/globals'
import { db, pickOrIgnore } from '../utils/index.js'

describe('# 工具包', () => {
  test('# db', () => {
    expect(db).not.toBeNull()
    expect(db).not.toBeUndefined()
  })

  test('# pickOrIgnore', () => {
    expect(
      pickOrIgnore({ username: 'opteacher', password: 'abcd' }, ['password'])
    ).not.toHaveProperty('password')
  })
})
