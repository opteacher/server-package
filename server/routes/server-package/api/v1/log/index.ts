import Router from 'koa-router'
import { login, verify, regup } from '../../../../../services/admin.js'

const router = new Router()

router.post('/in', async ctx => {
  ctx.body = {
    result: await login(ctx.request.body)
  }
})

router.get('/verify', ctx => {
  ctx.body = {
    result: verify(ctx.headers['authorization'])
  }
})

router.post('/regup', async ctx => {
  ctx.body = {
    result: await regup(ctx.request.body)
  }
})

export default router
