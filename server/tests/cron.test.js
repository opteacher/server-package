import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, describe, jest } from '@jest/globals'
import cronParser from 'cron-parser'
import { DateTime } from 'luxon'

describe('cron分析器', () => {
  test('一般分析', () => {
    const current = DateTime.fromJSDate(new Date(), { zone: 'Asia/Shanghai' })
    console.log(current.toJSDate())
    const cronTime = cronParser.parseExpression('*/5 * * * * ?', {
      currentDate: current.toJSDate(),
      tz: 'Asia/Shanghai'
    })
    console.log(cronTime.next().toDate())
  })
})
