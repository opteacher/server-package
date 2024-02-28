import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, describe } from '@jest/globals'
import { Agenda } from '@hokify/agenda'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import mongoose from 'mongoose'

const address = 'mongodb://root:12345@127.0.0.1:27017/agenda_job?authSource=admin'
const agenda = new Agenda({
  db: {
    address,
    collection: 'agendaJobs'
  }
})

describe('# Agenda定时任务测试', () => {
  describe('# 定义任务', () => {
    beforeAll(async () => {
      const { connection } = await mongoose.connect(address)
      await connection.collection('agendaJob').drop()
    })

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

  describe('# 延时任务', () => {})

  describe('# 定时任务', () => {})

  describe('# 控制任务', () => {})
})
