import Router from 'koa-router'
import { resolve } from 'path'
import { readConfig } from '../../../../../lib/backend-library/utils/index.js'

const router = new Router()

router.get('/secret', async ctx => {
  ctx.body = {
    result: {
      secret: (await readConfig(resolve('configs', 'server'))).secret
    }
  }
})

export default router
