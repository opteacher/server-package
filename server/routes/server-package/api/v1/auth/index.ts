import Path from 'path'
import Router from 'koa-router'
import { readConfig } from '../../../../../lib/backend-library/utils/index.js'
import { bind } from '../../../../../services/auth.js'

const router = new Router()
const config = readConfig(Path.resolve('configs', 'server'), false)

router.get('/secret', ctx => {
  ctx.body = {
    result: { secret: config.secret }
  }
})

router.put('/:aid/bind', async ctx => {
  ctx.body = {
    result: await bind(ctx.params.aid, ctx.request.body.model)
  }
})

export default router
