import Path from 'path'
import Router from 'koa-router'
import { readConfig } from '../../../../../lib/backend-library/utils/index.js'

const router = new Router()
const config = readConfig(Path.resolve('configs', 'server'), false)

router.get('/secret', ctx => {
  ctx.body = {
    result: { secret: config.secret }
  }
})

export default router
