import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, describe, jest } from '@jest/globals'
import { Agenda } from '@hokify/agenda'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import mongoose from 'mongoose'

const address = globalThis.__MONGO_URI__ + globalThis.__MONGO_DB_NAME__
const agenda = new Agenda({
  db: {
    address,
    collection: 'agendaJobs'
  }
})
let connection = null

describe('# Agenda定时任务测试', () => {
  beforeEach(async () => {
    try {
      connection = await mongoose.connect(address)
      await connection.db.dropCollection('agendaJob')
    } catch (e) {}
  })

  afterAll(async () => {
    await connection.disconnect()
  })

  describe('# 定义任务', () => {
    test('# 同步任务', async () => {
      const emitter = new Emitter()
      agenda.define('my_job', () => {
        emitter.emit('finish')
      })
      expect(async () => {
        await new Promise((resolve, reject) => {
          const h = setTimeout(reject, 5000)
          emitter.on('finish', () => {
            clearTimeout(h)
            resolve()
          })
        })
      }).not.toThrow()
      await agenda.start()
      await agenda.now('my_job')
    })

    test('# 异步任务', async () => {
      const emitter = new Emitter()
      agenda.define('my_job', async () => {
        await new Promise(resolve => setTimeout(resolve, 3000))
        emitter.emit('finish')
      })
      const startAt = Date.now()
      await agenda.start()
      await agenda.now('my_job')
      await new Promise(resolve =>
        emitter.on('finish', () => {
          expect(Date.now() - startAt).toBeGreaterThanOrEqual(3000)
          resolve()
        })
      )
    })

    test('# 参数测试', async () => {
      const emitter = new Emitter()
      agenda.define('my_job', job => {
        expect(job.attrs.data).toHaveProperty('params', 'abcd')
        emitter.emit('finish')
      })
      await agenda.start()
      await agenda.now('my_job', { params: 'abcd' })
      await new Promise(resolve => {
        emitter.on('finish', resolve)
      })
    })
  })

  describe('# 延时任务', () => {
    test('# 检测时间是否正确', async () => {
      const emitter = new Emitter()
      agenda.define('my_job', () => {
        const duration = Date.now() - now
        expect(Math.abs(duration - 2000)).toBeLessThan(50)
        emitter.emit('finish')
      })
      const now = Date.now()
      await agenda.start()
      await agenda.schedule('2 second', 'my_job')
      await new Promise(resolve => {
        emitter.on('finish', resolve)
      })
    }, 60000)

    test('# 多任务', async () => {
      const callback = jest.fn()
      agenda.define('my_job_1', callback)
      agenda.define('my_job_2', callback)
      await agenda.start()
      await agenda.schedule('10 second', ['my_job_1', 'my_job_2'])
      await new Promise(resolve =>
        setTimeout(() => {
          expect(callback).toBeCalledTimes(2)
          resolve()
        }, 10100)
      )
    }, 60000)
  })

  describe('# 定时任务', () => {})

  describe('# 控制任务', () => {})
})
