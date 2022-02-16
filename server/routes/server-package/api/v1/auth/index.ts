import Path from 'path'
import Router from 'koa-router'
import { readConfig } from '../../../../../lib/backend-library/utils/index.js'
import { genSignLgc } from '../../../../../services/auth.js'

const router = new Router()
const config = readConfig(Path.resolve('configs', 'server'), false)

router.get('/secret', ctx => {
  ctx.body = {
    result: { secret: config.secret }
  }
})

router.post('/project/:pid/sign', async ctx => {
  ctx.body = {
    result: await genSignLgc(ctx.params.pid, ctx.request.body.props)
  }
})

export default router
