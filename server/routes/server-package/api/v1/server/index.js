import Router from 'koa-router'
import { resolve } from 'path'
import { readConfig } from '../../../../../lib/backend-library/utils/index.js'

const router = new Router()

router.get('/secret', async ctx => {
  const config = await readConfig(resolve('configs', 'server'))
  ctx.body = {
    result: {
      secret: process.env['server.secret'] || config.secret
    }
  }
})

export default router
